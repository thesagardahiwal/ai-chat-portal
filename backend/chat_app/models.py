# backend/chat_app/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Conversation(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('ended', 'Ended'),
    ]
    
    title = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    summary = models.TextField(null=True, blank=True)
    sentiment = models.CharField(max_length=50, null=True, blank=True)
    key_topics = models.JSONField(default=list, blank=True)
    action_items = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['-start_time']
    
    def __str__(self):
        return f"{self.title} ({self.user.username})"

class Message(models.Model):
    SENDER_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()  # This should NOT be null
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    embeddings = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender}: {self.content[:50]}..."

class ConversationAnalysis(models.Model):
    conversation = models.OneToOneField(Conversation, on_delete=models.CASCADE, related_name='analysis')
    sentiment_score = models.FloatField(null=True, blank=True)
    topic_distribution = models.JSONField(default=dict)
    key_phrases = models.JSONField(default=list)
    conversation_length = models.IntegerField(default=0)
    average_response_time = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Analysis for {self.conversation.title}"