import pika
import json
import time

credits = pika.PlainCredentials("admin", "admin123")

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host="localhost",
        credentials=credits
    )
)

channel = connection.channel()
channel.exchange_declare(exchange='news_updates', exchange_type='fanout')

news_articles = [
    {"headline": "Breaking: Market hits all-time high", "category": "finance"},
    {"headline": "Sports: Team India wins final!", "category": "sports"},
    {"headline": "Weather Alert: Heavy rain expected tomorrow", "category": "weather"},
    {"headline": "Tech: New AI model released by OpenAI", "category": "tech"}
]

for article in news_articles:
    message = json.dumps(article)
    print("Publishing article:", message)
    channel.basic_publish(
        exchange='news_updates',
        routing_key='',   # ignored for fanout
        body=message
    )
    print(f" [x] Published article: {message}")
    time.sleep(1)  

connection.close()