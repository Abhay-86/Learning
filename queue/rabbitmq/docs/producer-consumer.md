

---

# 📘 **RabbitMQ Documentation — Producer/Consumer & Worker Queue Model**

---

# ## **1. Producer – Consumer Model (Default Exchange)**

### ### **Overview**

In the simplest RabbitMQ setup, a **producer** sends messages directly to a **queue**, and a **consumer** reads from that queue.

This uses the **default exchange** (empty string `""`), which maps messages **directly to a queue name** using the routing key.

---

## **1.1 Why `exchange=''`?**

RabbitMQ has a built-in exchange called the **default exchange**:

* Represented by an empty string: `exchange=""`
* Does NOT require explicit declaration
* Routes messages directly to a queue **whose name matches the routing_key**

Example:

```python
channel.basic_publish(
    exchange='',
    routing_key='hello',   # message goes directly to queue named "hello"
    body="Hello World"
)
```

Meaning:

> **Using the default exchange is like directly sending to the queue.**

This is perfect for simple producer→consumer patterns.

---

## **1.2 Sending Strings or JSON**

RabbitMQ always transfers **bytes**.
But you can send any format:

### ✔ Strings

```python
channel.basic_publish(
    exchange='',
    routing_key='hello',
    body="Hello World"
)
```

RabbitMQ converts the Python string → bytes internally.

### ✔ JSON (recommended for structured data)

```python
import json

payload = {"task": "sum", "start": 1, "end": 100}
channel.basic_publish(
    exchange='',
    routing_key='task_queue',
    body=json.dumps(payload)
)
```

On the **consumer side**, you parse it back:

```python
data = json.loads(body)
```

### Important:

RabbitMQ **does not care** what you put in the body.
All messages are treated as raw bytes.

---

## **1.3 Queue Must Always Be Declared**

Before sending messages, you must declare the queue:

```python
channel.queue_declare(queue='hello')
```

Why?

* If queue doesn’t exist → message is lost
* Declaring is **idempotent**:
  It will NOT recreate or overwrite an existing queue

This is required both in:

* producer
* consumer

---

## **1.4 Consumer Setup**

A consumer subscribes to the queue:

```python
channel.basic_consume(
    queue='hello',
    on_message_callback=callback,
    auto_ack=True
)
```

RabbitMQ will call your callback function for every message:

```python
def callback(ch, method, properties, body):
    print("Received:", body.decode())
```

---
