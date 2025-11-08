# serializers.py
from rest_framework import serializers
from .models import Conversation, Message, ConversationAnalysis
from django.utils import timezone
from django.contrib.auth.models import User

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender', 'timestamp', 'conversation']

class ConversationAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationAnalysis
        fields = '__all__'

class ConversationListSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'status', 'start_time', 'end_time', 'summary', 'message_count', 'last_message']
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        return last_msg.content if last_msg else None

class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    analysis = ConversationAnalysisSerializer(read_only=True)
    
    class Meta:
        model = Conversation
        fields = '__all__'

# Fix: Create proper serializer for sending messages
class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    conversation_id = serializers.IntegerField(required=False, allow_null=True)

class QuerySerializer(serializers.Serializer):
    query = serializers.CharField(required=True)
    date_range = serializers.DictField(required=False)
    topics = serializers.ListField(child=serializers.CharField(), required=False)

class QueryResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    relevant_conversations = serializers.ListField(child=serializers.CharField())
    supporting_excerpts = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )

class SupportingExcerptSerializer(serializers.Serializer):
    conversation = serializers.CharField()
    content = serializers.CharField()
    sender = serializers.CharField()
    similarity = serializers.FloatField()
    timestamp = serializers.CharField()    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField()
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)