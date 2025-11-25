import pika, sys, os

def main():
    credentials = pika.PlainCredentials('admin', 'admin123')
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host='localhost',
            credentials=credentials
        )
    )

    channel = connection.channel()
    channel.queue_declare(queue='hello')

    def callback(ch, method, properties, body):
        print("Received:", body)

    channel.basic_consume(
        queue='hello',
        on_message_callback=callback,
        auto_ack=True
    )

    print("[*] Waiting for messages. CTRL+C to exit")
    channel.start_consuming()

if __name__ == '__main__':
    main()
