import pika
import json

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

def callback(ch, method, properties, body):
    task_data = json.loads(body)
    task = task_data["task"]
    start = task_data["start"]
    end = task_data["end"]

    print(f" [x] Received task: {task}")

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
        result = "Unknown task"

    print(f" [✓] Result: {result}")

    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='task_queue', on_message_callback=callback, auto_ack=False)

channel.start_consuming()