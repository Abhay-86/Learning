import pika
import json

def process_company(item):
    print("🏢 Sync company:", item["name"])
    # update DB here

def process_job(item):
    print("💼 Sync job:", item["title"])
    # update DB here


credentials = pika.PlainCredentials("admin", "admin123")
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost', credentials=credentials)
)
channel = connection.channel()

channel.exchange_declare(exchange='scraper_updates', exchange_type='fanout')

result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

channel.queue_bind(exchange='scraper_updates', queue=queue_name)

print("📥 Backend waiting for scraper updates...")

def callback(ch, method, properties, body):
    msg = json.loads(body)

    items = msg["data"]  # always a list
    type_name = msg["type"]

    if type_name == "company":
        for item in items:
            process_company(item)

    elif type_name == "job":
        for item in items:
            process_job(item)

channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
channel.start_consuming()
