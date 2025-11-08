from rest_framework import serializers
from .models import Conversation, Message, ConversationAnalysis

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender', 'timestamp']

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

class ChatMessageSerializer(serializers.Serializer):
    content = serializers.CharField()
    conversation_id = serializers.IntegerField(required=False)

class QuerySerializer(serializers.Serializer):
    query = serializers.CharField()
    date_range = serializers.JSONField(required=False)
    topics = serializers.ListField(child=serializers.CharField(), required=False)