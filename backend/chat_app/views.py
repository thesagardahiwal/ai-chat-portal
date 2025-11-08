# views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from .models import Conversation, Message, ConversationAnalysis
from .serializers import *
from .ai_integration import GeminiAIIntegration
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from rest_framework.authtoken.models import Token
from django.http import StreamingHttpResponse
from django.utils import timezone
from .serializers import QuerySerializer
import json
import logging
from datetime import datetime, timedelta
logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """Get CSRF token for the session"""
    return Response({'csrfToken': get_token(request)})

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User login view"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        
        # Get or create token for token authentication
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'token': token.key,  # For token authentication
        })
    else:
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """User registration view"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not username or not email or not password:
        return Response(
            {'error': 'Username, email, and password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create token for the new user
        token = Token.objects.create(user=user)
        
        return Response({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'token': token.key,
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """User logout view"""
    logout(request)
    return Response({'message': 'Logout successful'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """Get current user information"""
    user = request.user
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    })




class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        return ConversationDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    @action(detail=False, methods=['get'])
    def debug_conversations(self, request):
        """Debug endpoint to see what conversations exist"""
        conversations = self.get_queryset()
        
        debug_data = []
        for conv in conversations:
            debug_data.append({
                'id': conv.id,
                'title': conv.title,
                'status': conv.status,
                'message_count': conv.messages.count(),
                'has_summary': bool(conv.summary),
                'key_topics': conv.key_topics,
                'start_time': conv.start_time,
                'end_time': conv.end_time,
            })
        
        return Response({
            'total_conversations': conversations.count(),
            'conversations': debug_data
        })
        
    # backend/chat_app/views.py
    @action(detail=False, methods=['post'])
    def query_conversations(self, request):
        """Intelligent querying across past conversations"""
        serializer = QuerySerializer(data=request.data)
        if serializer.is_valid():
            query = serializer.validated_data['query']
            date_range = serializer.validated_data.get('date_range')
            topics = serializer.validated_data.get('topics', [])
            
            # Debug: Log the incoming request
            logger.info(f"Query received: {query}")
            logger.info(f"Date range: {date_range}")
            logger.info(f"Topics: {topics}")
            
            # Filter conversations for the current user - include both active and ended
            conversations_qs = self.get_queryset()  # This gets all user's conversations
            
            # Apply date range filter if provided
            if date_range:
                start_date = date_range.get('start')
                end_date = date_range.get('end')

                if start_date and end_date:
                    try:
                        start_date = datetime.strptime(start_date, "%Y-%m-%d")
                        end_date = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                        conversations = conversations_qs.filter(start_time__range=(start_date, end_date))
                    except ValueError:
                        logger.warning("Invalid date format in date_range, skipping filter")
            
            # Apply topics filter if provided
            if topics:
                # Search in key_topics array field using Django's JSONField lookups
                topics_query = Q()
                for topic in topics:
                    topics_query |= Q(key_topics__contains=[topic])
                conversations_qs = conversations_qs.filter(topics_query)
            
            # Convert queryset to list for AI processing
            conversations_list = list(conversations_qs)
            
            # Debug: Log conversation count
            logger.info(f"Found {len(conversations_list)} conversations for user {request.user.username}")
            
            if not conversations_list:
                return Response({
                    "answer": "I couldn't find any past conversations matching your criteria.",
                    "relevant_conversations": [],
                    "supporting_excerpts": []
                })
            
            # Prepare conversations data for AI querying
            conversations_data = []
            for conv in conversations_list:
                # Get all messages for this conversation
                messages = conv.messages.all().order_by('timestamp')
                
                # Debug: Log conversation details
                logger.info(f"Conversation: {conv.title}, Messages: {messages.count()}, Status: {conv.status}")
                
                messages_data = []
                
                for msg in messages:
                    message_data = {
                        'content': msg.content,
                        'sender': msg.sender,
                        'timestamp': msg.timestamp.isoformat(),
                        'embeddings': msg.embeddings
                    }
                    messages_data.append(message_data)
                
                conv_data = {
                    'id': conv.id,
                    'title': conv.title,
                    'start_time': conv.start_time.isoformat(),
                    'summary': conv.summary,
                    'sentiment': conv.sentiment,
                    'key_topics': conv.key_topics or [],
                    'messages': messages_data
                }
                conversations_data.append(conv_data)
            
            # Get intelligent response from AI
            ai = GeminiAIIntegration()
            try:
                logger.info(f"Sending {len(conversations_data)} conversations to AI for query: {query}")
                query_result = ai.query_past_conversations(query, conversations_data)
                logger.info(f"AI query result: {query_result}")
                return Response(query_result)
            except Exception as e:
                logger.error(f"Error querying conversations with AI: {e}")
                return Response({
                    "answer": "I apologize, but I encountered an error while searching through your conversations. Please try again.",
                    "relevant_conversations": [],
                    "supporting_excerpts": []
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            finally:
                ai.close()
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def end_conversation(self, request, pk=None):
        conversation = self.get_object()
        if conversation.status == 'active':
            conversation.status = 'ended'
            conversation.end_time = timezone.now()
            
            # Generate summary and analysis
            ai = GeminiAIIntegration()
            messages = conversation.messages.all()
            messages_data = [
                {
                    'sender': 'user' if msg.sender == 'user' else 'ai',
                    'content': msg.content
                }
                for msg in messages
            ]
            
            try:
                analysis = ai.generate_conversation_summary(messages_data)
                
                conversation.summary = analysis.get('summary', '')
                conversation.sentiment = analysis.get('sentiment', 'neutral')
                conversation.key_topics = analysis.get('key_topics', [])
                conversation.action_items = analysis.get('action_items', [])
                conversation.save()
                
                # Create detailed analysis
                ConversationAnalysis.objects.create(
                    conversation=conversation,
                    sentiment_score=0.8 if analysis.get('sentiment') == 'positive' else 0.5,
                    topic_distribution={topic: 0.2 for topic in analysis.get('key_topics', [])},
                    key_phrases=analysis.get('key_topics', []),
                    conversation_length=conversation.messages.count()
                )
                
            except Exception as e:
                logger.error(f"Error generating conversation summary: {e}")
                conversation.summary = "Summary unavailable"
                conversation.save()
            finally:
                ai.close()
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def send_message_stream(self, request):
        """Streaming version of send_message"""
        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            content = serializer.validated_data['content']
            conversation_id = serializer.validated_data.get('conversation_id')
            
            # Validate content is not empty
            if not content or not content.strip():
                return Response(
                    {"error": "Message content cannot be empty"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            def generate_stream():
                ai = GeminiAIIntegration()
                conversation = None
                user_message = None
                
                try:
                    # Get or create conversation
                    if conversation_id:
                        try:
                            conversation = Conversation.objects.get(id=conversation_id, user=request.user)
                        except Conversation.DoesNotExist:
                            yield f"data: {json.dumps({'error': 'Conversation not found'})}\n\n"
                            return
                    else:
                        # Create new conversation with initial title
                        initial_title = content[:50] + "..." if len(content) > 50 else content
                        conversation = Conversation.objects.create(
                            title=initial_title,
                            user=request.user,
                            status='active'
                        )
                    
                    # Save user message
                    user_message = Message.objects.create(
                        conversation=conversation,
                        content=content.strip(),
                        sender='user',
                        embeddings=ai.generate_embeddings(content)
                    )
                    
                    # Send user message data
                    yield f"data: {json.dumps({'type': 'user_message', 'data': MessageSerializer(user_message).data})}\n\n"
                    
                    # Prepare conversation history for AI
                    previous_messages = conversation.messages.all().order_by('timestamp')[:10]
                    messages_for_ai = [
                        {
                            "role": "system",
                            "content": "You are a helpful AI assistant. Provide thoughtful, engaging responses."
                        }
                    ]
                    
                    for msg in previous_messages:
                        role = "user" if msg.sender == "user" else "assistant"
                        messages_for_ai.append({"role": role, "content": msg.content})
                    
                    # Stream AI response
                    full_response = ""
                    for chunk in ai.get_llm_response_stream(messages_for_ai):
                        if chunk:
                            full_response += chunk
                            yield f"data: {json.dumps({'type': 'ai_chunk', 'data': chunk})}\n\n"
                    
                    # Save the complete AI response
                    if full_response.strip():
                        ai_message = Message.objects.create(
                            conversation=conversation,
                            content=full_response.strip(),
                            sender='ai',
                            embeddings=ai.generate_embeddings(full_response)
                        )
                        
                        # Send complete message data
                        yield f"data: {json.dumps({'type': 'ai_message', 'data': MessageSerializer(ai_message).data})}\n\n"
                        
                        # Update conversation if needed
                        if conversation.messages.count() == 2 and full_response.strip():  # User + AI message
                            try:
                                title_prompt = [
                                    {
                                        "role": "system", 
                                        "content": f"Generate a very short title (max 5 words) for this conversation starter: '{content}'"
                                    }
                                ]
                                title_response = ai.get_llm_response(title_prompt)
                                if title_response and title_response.strip():
                                    conversation.title = title_response.strip('"\'')[:50]
                                    conversation.save()
                            except Exception as e:
                                logger.error(f"Error generating title: {e}")
                    
                    yield f"data: {json.dumps({'type': 'complete'})}\n\n"
                    
                except Exception as e:
                    logger.error(f"Error in send_message_stream: {e}")
                    yield f"data: {json.dumps({'type': 'error', 'data': 'Failed to process your message'})}\n\n"
                finally:
                    ai.close()
            
            return StreamingHttpResponse(
                generate_stream(),
                content_type='text/event-stream',
                headers={'Cache-Control': 'no-cache'}
            )

        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)