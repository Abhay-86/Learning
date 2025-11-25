import pika
import json

credentials = pika.PlainCredentials("admin", "admin123")

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost', credentials=credentials)
)

channel = connection.channel()

channel.exchange_declare(exchange='news_updates', exchange_type='fanout')

result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

channel.queue_bind(exchange='news_updates', queue=queue_name)

print("[Subscriber 2] Logging news to file...")

def callback(ch, method, properties, body):
    data = json.loads(body)
    with open("news_log.txt", "a") as file:
        file.write(data["headline"] + "\n")
    print("[Subscriber 2] Logged:", data["headline"])

channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)

channel.start_consuming()
