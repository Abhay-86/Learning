import pika

credentials = pika.PlainCredentials("admin", "admin123")

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host="localhost",
        credentials=credentials
    )
)

channel = connection.channel()
print("Connection established successfully.")

channel.basic_publish(
    exchange='',
    routing_key='hello',
    body='Singh!'
)
print(" [x] Sent 'Hello World!'")


connection.close()
print("Connection closed.")