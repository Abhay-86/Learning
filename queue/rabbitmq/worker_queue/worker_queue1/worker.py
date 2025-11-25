import pika
import json
import time

credentials = pika.PlainCredentials("admin", "admin123")

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='localhost',
        credentials=credentials
    )
)

channel = connection.channel()
channel.queue_declare(queue='task_queue', durable=True)
channel.basic_qos(prefetch_count=1)

print(" [*] Worker started. Waiting for tasks...")

def callback(ch, method, properties, body):
    data = json.loads(body)
    task = data["task"]
    start = data["start"]
    end = data["end"]

    print(f"[{id}] Received task:", data)

    # Heavy work
    if task == "sum":
        result = sum(range(start, end + 1))

    elif task == "subtract":
        result = start
        for i in range(start + 1, end + 1):
            result -= i

    elif task == "multiply":
        result = 1
        for i in range(start, end + 1):
            result *= i

    else:
        result = None

    print(f"[✓] Result: {result}\n")
    time.sleep(1)  # simulate heavy CPU work

    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='task_queue', on_message_callback=callback)
channel.start_consuming()
