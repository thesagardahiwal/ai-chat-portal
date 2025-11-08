from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Conversation, Message
from .serializers import *
from .ai_integration import AIIntegration

class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Conversation.objects.all()  # ✅ required
    
    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        return ConversationDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def end_conversation(self, request, pk=None):
        conversation = self.get_object()
        if conversation.status == 'active':
            conversation.status = 'ended'
            conversation.end_time = timezone.now()
            
            # Generate summary and analysis
            ai = AIIntegration()
            messages_data = MessageSerializer(conversation.messages.all(), many=True).data
            analysis = ai.generate_conversation_summary(messages_data)
            
            conversation.summary = analysis.get('summary', '')
            conversation.sentiment = analysis.get('sentiment', 'neutral')
            conversation.key_topics = analysis.get('key_topics', [])
            conversation.action_items = analysis.get('action_items', [])
            conversation.save()
            
            # Create detailed analysis
            ConversationAnalysis.objects.create(
                conversation=conversation,
                sentiment_score=0.0,  # Could be calculated
                topic_distribution={},
                key_phrases=analysis.get('key_topics', []),
                conversation_length=conversation.messages.count()
            )
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def send_message(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        if serializer.is_valid():
            content = serializer.validated_data['content']
            conversation_id = serializer.validated_data.get('conversation_id')
            
            ai = AIIntegration()
            
            # Get or create conversation
            if conversation_id:
                conversation = Conversation.objects.get(id=conversation_id, user=request.user)
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
                content=content,
                sender='user',
                embeddings=ai.generate_embeddings(content)
            )
            
            # Prepare conversation history for AI
            previous_messages = conversation.messages.all()[:10]  # Last 10 messages for context
            messages_for_ai = [
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant. Provide thoughtful, engaging responses."
                }
            ]
            
            for msg in previous_messages:
                role = "user" if msg.sender == "user" else "assistant"
                messages_for_ai.append({"role": role, "content": msg.content})
            
            # Get AI response
            ai_response = ai.get_llm_response(messages_for_ai)
            
            # Save AI response
            ai_message = Message.objects.create(
                conversation=conversation,
                content=ai_response,
                sender='ai',
                embeddings=ai.generate_embeddings(ai_response)
            )
            
            # Update conversation title if it's the first message
            if conversation.messages.count() == 2:  # User + AI message
                title_prompt = [{"role": "system", "content": f"Generate a very short title (max 5 words) for this conversation starter: '{content}'"}]
                title = ai.get_llm_response(title_prompt)
                conversation.title = title.strip('"\'')
                conversation.save()
            
            response_data = {
                'conversation': ConversationDetailSerializer(conversation).data,
                'user_message': MessageSerializer(user_message).data,
                'ai_message': MessageSerializer(ai_message).data
            }
            
            return Response(response_data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def query_conversations(self, request):
        serializer = QuerySerializer(data=request.data)
        if serializer.is_valid():
            query = serializer.validated_data['query']
            date_range = serializer.validated_data.get('date_range')
            topics = serializer.validated_data.get('topics', [])
            
            # Filter conversations
            conversations_qs = self.get_queryset().filter(status='ended')
            
            if date_range:
                start_date = date_range.get('start')
                end_date = date_range.get('end')
                if start_date:
                    conversations_qs = conversations_qs.filter(start_time__gte=start_date)
                if end_date:
                    conversations_qs = conversations_qs.filter(start_time__lte=end_date)
            
            if topics:
                conversations_qs = conversations_qs.filter(
                    Q(key_topics__overlap=topics) | Q(title__icontains=topics[0])
                )
            
            # Prepare conversations for AI querying
            conversations_data = []
            for conv in conversations_qs:
                conv_data = {
                    'id': conv.id,
                    'title': conv.title,
                    'start_time': conv.start_time,
                    'messages': MessageSerializer(conv.messages.all(), many=True).data
                }
                conversations_data.append(conv_data)
            
            # Get intelligent response
            ai = AIIntegration()
            query_result = ai.query_past_conversations(query, conversations_data)
            
            return Response(query_result)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)