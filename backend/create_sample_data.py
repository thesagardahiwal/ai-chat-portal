# create_sample_data.py
import os
import django
from django.utils import timezone
from datetime import timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from chat_app.models import Conversation, Message, ConversationAnalysis

def create_sample_conversations():
    # Get users
    try:
        pranav = User.objects.get(username='pranavpatil')
        john = User.objects.get(username='johndoe')
    except User.DoesNotExist:
        print("Please create the users first: john_doe and jane_smith")
        return

    # Sample data for John Doe
    john_data = [
        {
            "title": "Travel Planning to Japan",
            "status": "ended",
            "summary": "Discussed travel itinerary for Japan including Tokyo, Kyoto, and Osaka. Covered accommodation options, transportation, and cultural sites to visit.",
            "sentiment": "positive",
            "key_topics": ["Japan travel", "itinerary planning", "accommodation", "transportation", "cultural sites"],
            "action_items": ["Research hotels in Tokyo", "Book Shinkansen tickets", "Create daily itinerary"],
            "messages": [
                {"content": "I'm planning a trip to Japan for 2 weeks. Can you help me create an itinerary?", "sender": "user"},
                {"content": "Certainly! Japan is a wonderful destination. For a 2-week trip, I recommend splitting your time between Tokyo, Kyoto, and Osaka. Would you like me to suggest a detailed itinerary?", "sender": "ai"},
                {"content": "Yes, please! I'm interested in both modern cities and traditional cultural experiences.", "sender": "user"},
                {"content": "Great! Here's a suggested itinerary:\nDays 1-5: Tokyo (modern culture, shopping, museums)\nDays 6-9: Kyoto (temples, traditional gardens)\nDays 10-12: Osaka (food, castle, day trips)\nDays 13-14: Return to Tokyo for departure\nWould you like me to elaborate on any specific part?", "sender": "ai"},
                {"content": "Can you suggest some must-visit temples in Kyoto?", "sender": "user"},
                {"content": "Absolutely! In Kyoto, don't miss:\n- Kinkaku-ji (Golden Pavilion)\n- Fushimi Inari Shrine (famous torii gates)\n- Kiyomizu-dera (wooden temple with great views)\n- Ryoan-ji (famous rock garden)\nThese represent some of the best traditional Japanese architecture and gardens.", "sender": "ai"}
            ]
        },
        {
            "title": "Learning Python Programming",
            "status": "ended", 
            "summary": "Discussed Python learning path for beginners, recommended resources, and project ideas. Covered basic syntax, data structures, and practical applications.",
            "sentiment": "positive",
            "key_topics": ["Python programming", "learning resources", "project ideas", "syntax basics", "data structures"],
            "action_items": ["Complete Python basics course", "Build a simple calculator project", "Practice with coding exercises"],
            "messages": [
                {"content": "I want to learn Python programming from scratch. Where should I start?", "sender": "user"},
                {"content": "That's a great choice! Python is beginner-friendly and versatile. I recommend starting with:\n1. Basic syntax and data types\n2. Control structures (if-else, loops)\n3. Functions and modules\n4. Basic data structures (lists, dictionaries)\nWould you like specific resource recommendations?", "sender": "ai"},
                {"content": "Yes, please recommend some good learning resources.", "sender": "user"},
                {"content": "Here are excellent resources for beginners:\n- Python.org's official tutorial\n- Codecademy's Python course\n- 'Automate the Boring Stuff with Python' (free online)\n- Coursera's Python for Everybody specialization\nStart with one resource and practice regularly with small projects.", "sender": "ai"},
                {"content": "What kind of projects should I build as a beginner?", "sender": "user"},
                {"content": "Perfect beginner projects:\n1. Calculator\n2. Number guessing game\n3. Simple to-do list application\n4. Basic web scraper\n5. Weather app using an API\nThese projects will help you understand practical Python applications while building your skills gradually.", "sender": "ai"}
            ]
        }
    ]

    # Sample data for Jane Smith
    jane_data = [
        {
            "title": "Career Development Strategy", 
            "status": "ended",
            "summary": "Discussed career advancement strategies, skill development, and networking approaches for professional growth in the tech industry.",
            "sentiment": "positive",
            "key_topics": ["career development", "skill building", "networking", "professional growth", "tech industry"],
            "action_items": ["Update LinkedIn profile", "Learn new programming language", "Attend industry meetups"],
            "messages": [
                {"content": "I want to advance my career in software development. What steps should I take?", "sender": "user"},
                {"content": "Career advancement in software development typically involves:\n1. Mastering your current tech stack\n2. Learning adjacent technologies\n3. Building a strong portfolio\n4. Networking effectively\n5. Developing soft skills\nWhich area would you like to focus on first?", "sender": "ai"},
                {"content": "I think I need to improve my networking skills. Any tips?", "sender": "user"},
                {"content": "Great focus! Here are effective networking strategies:\n- Attend local tech meetups and conferences\n- Participate in online communities (GitHub, Stack Overflow)\n- Connect with colleagues on LinkedIn\n- Contribute to open-source projects\n- Practice your elevator pitch\nRemember, networking is about building genuine relationships, not just collecting contacts.", "sender": "ai"}
            ]
        },
        {
            "title": "Home Gardening Tips",
            "status": "ended",
            "summary": "Discussed beginner gardening techniques, plant selection, and maintenance for a small home garden with limited space.",
            "sentiment": "positive", 
            "key_topics": ["gardening basics", "plant selection", "container gardening", "plant care", "organic methods"],
            "action_items": ["Start with herbs and lettuce", "Get quality potting soil", "Set up watering schedule"],
            "messages": [
                {"content": "I want to start a small vegetable garden on my balcony. What are good plants for beginners?", "sender": "user"},
                {"content": "Balcony gardening is wonderful! Perfect beginner plants:\n- Herbs: basil, mint, parsley (easy to grow)\n- Leafy greens: lettuce, spinach, kale\n- Cherry tomatoes (need support)\n- Radishes (quick harvest)\n- Green onions (regrow from scraps)\nThese are relatively low-maintenance and don't require much space.", "sender": "ai"},
                {"content": "What size containers should I use?", "sender": "user"},
                {"content": "Container sizes depend on the plant:\n- Herbs: 6-8 inch pots\n- Lettuce: 8-10 inch containers\n- Tomatoes: 5-gallon buckets or larger\n- Root vegetables: 12+ inch deep containers\nEnsure all containers have drainage holes and use quality potting mix, not garden soil.", "sender": "ai"}
            ]
        }
    ]

    # Create conversations for John
    for i, conv_data in enumerate(john_data):
        conversation = Conversation.objects.create(
            title=conv_data["title"],
            user=pranav,
            status=conv_data["status"],
            summary=conv_data["summary"],
            sentiment=conv_data["sentiment"],
            key_topics=conv_data["key_topics"],
            action_items=conv_data["action_items"],
            end_time=timezone.now() - timedelta(days=len(john_data)-i)
        )
        
        # Create messages
        for j, msg_data in enumerate(conv_data["messages"]):
            Message.objects.create(
                conversation=conversation,
                content=msg_data["content"],
                sender=msg_data["sender"],
                timestamp=timezone.now() - timedelta(days=len(john_data)-i, hours=len(conv_data["messages"])-j)
            )
        
        # Create analysis
        ConversationAnalysis.objects.create(
            conversation=conversation,
            sentiment_score=0.8 if conv_data["sentiment"] == "positive" else 0.5,
            topic_distribution={topic: 0.2 for topic in conv_data["key_topics"]},
            key_phrases=conv_data["key_topics"],
            conversation_length=len(conv_data["messages"])
        )

    # Create conversations for Jane
    for i, conv_data in enumerate(jane_data):
        conversation = Conversation.objects.create(
            title=conv_data["title"],
            user=john,
            status=conv_data["status"],
            summary=conv_data["summary"],
            sentiment=conv_data["sentiment"],
            key_topics=conv_data["key_topics"],
            action_items=conv_data["action_items"],
            end_time=timezone.now() - timedelta(days=len(jane_data)-i + 2)
        )
        
        # Create messages
        for j, msg_data in enumerate(conv_data["messages"]):
            Message.objects.create(
                conversation=conversation,
                content=msg_data["content"],
                sender=msg_data["sender"],
                timestamp=timezone.now() - timedelta(days=len(jane_data)-i + 2, hours=len(conv_data["messages"])-j)
            )
        
        # Create analysis
        ConversationAnalysis.objects.create(
            conversation=conversation,
            sentiment_score=0.8 if conv_data["sentiment"] == "positive" else 0.5,
            topic_distribution={topic: 0.2 for topic in conv_data["key_topics"]},
            key_phrases=conv_data["key_topics"],
            conversation_length=len(conv_data["messages"])
        )

    print(f"Created {len(john_data)} conversations for Pranav")
    print(f"Created {len(jane_data)} conversations for John")
    print("Sample data created successfully!")

if __name__ == "__main__":
    create_sample_conversations()