
---

# 📘 **RabbitMQ Producer & Worker – Full Documentation**

This document explains how a RabbitMQ-based task queue works using:

* **Producer** → sends tasks
* **Worker (Consumer)** → processes tasks
* **RabbitMQ** → stores tasks reliably until processed

This guide covers correct reliability patterns including:

* Manual acknowledgements
* Requeue on failure
* Durable queues
* Persistent messages
* Crash behavior
* Fair dispatch with prefetch

---

# 1. 🔌 **RabbitMQ Connection (Shared by Producer & Worker)**

Both producer and consumer use this connection pattern:

```python
import pika

credentials = pika.PlainCredentials("admin", "admin123")

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host="localhost",
        credentials=credentials
    )
)

channel = connection.channel()
```

---

# 2. 📦 **Durable Queue (Production Safe)**

To ensure queues survive RabbitMQ restarts:

```python
channel.queue_declare(queue='task_queue', durable=True)
```

* Queue is persistent
* Tasks remain after server restart
* Safe for long background tasks

---

# 3. 📨 **Producer Overview**

A producer sends tasks to the queue.

### **Key Requirements**

| Requirement            | Why it matters                      |
| ---------------------- | ----------------------------------- |
| Persistent messages    | Prevent data loss on RabbitMQ crash |
| JSON body              | Easy to parse                       |
| Queue must be declared | Creates if missing (safe)           |

### **Producer Code**

```python
import pika, json

credentials = pika.PlainCredentials("admin", "admin123")
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host="localhost", credentials=credentials)
)
channel = connection.channel()

channel.queue_declare(queue="task_queue", durable=True)

task = {
    "task": "sum",
    "start": 1,
    "end": 100
}

channel.basic_publish(
    exchange="",
    routing_key="task_queue",
    body=json.dumps(task),
    properties=pika.BasicProperties(
        delivery_mode=2  # persistent message
    )
)

print("[x] Sent task:", task)
connection.close()
```

### ✔ What this producer guarantees:

* Message written safely to queue
* Message survives RabbitMQ restart
* Consumer will later process the task

---

# 4. 🧵 **Worker (Consumer) Overview**

Workers continuously listen to the queue and process tasks.

A worker must:

1. Declare the queue (idempotent)
2. Use **manual ACK**
3. Use **NACK with requeue** on failure
4. Use **prefetch_count=1** for fair worker distribution
5. Never use `auto_ack=True` in production

---

# 5. ⚙️ **Fair Dispatch (prefetch_count=1)**

```python
channel.basic_qos(prefetch_count=1)
```

This ensures:

* Each worker gets **only 1 message at a time**
* No worker is overloaded
* Fast workers get more tasks
* Slow workers get fewer tasks

This makes your system scalable.

---

# 6. 🔄 **Message Acknowledgement Logic**

### ✔ **Success → ACK**

```python
ch.basic_ack(delivery_tag=method.delivery_tag)
```

This deletes the message permanently.

---

### ❌ **Failure → NACK (Retry)**

```python
ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
```

This tells RabbitMQ:

> “Task failed. Put it back in the queue.”

So another worker can process it.

---

# 7. 💥 **What Happens When Worker Crashes?**

If your callback crashes **before acknowedgment**, RabbitMQ automatically requeues the message.

### Crash examples:

* Exception thrown
* Worker killed
* Network drop
* Machine shutdown

### Result:

✔ Message is NOT lost
✔ RabbitMQ requeues it
✔ Another worker gets it

This is **built-in reliability** thanks to `auto_ack=False`.

---

# 8. 🧠 **ACK vs NACK (requeue=True) – Final Difference**

| Action                     | Meaning          | Message Result            |
| -------------------------- | ---------------- | ------------------------- |
| `basic_ack()`              | Success          | Deleted                   |
| `basic_nack(requeue=True)` | Failed           | Returned to queue (retry) |
| Worker crash before ACK    | Implicit failure | Requeued automatically    |

---

# 9. 🛠 **Full Worker Code (Production-Ready)**

```python
import pika
import json

credentials = pika.PlainCredentials("admin", "admin123")
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost', credentials=credentials)
)
channel = connection.channel()

channel.queue_declare(queue='task_queue', durable=True)

# Fair dispatch
channel.basic_qos(prefetch_count=1)

def callback(ch, method, properties, body):
    try:
        data = json.loads(body.decode())
        task = data["task"]
        start = int(data["start"])
        end = int(data["end"])

        print(f"[x] Received task: {data}")

        # Example work
        if task == "sum":
            result = sum(range(start, end + 1))
        elif task == "multiply":
            result = 1
            for i in range(start, end + 1):
                result *= i
        else:
            raise ValueError("Unknown task type")

        print(f"[✓] Result: {result}")

        # Acknowledge success
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print("[!] Error:", e)

        # Retry the task
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

channel.basic_consume(
    queue='task_queue',
    on_message_callback=callback,
    auto_ack=False
)

print("[*] Worker running. CTRL+C to exit.")
channel.start_consuming()
```

---

# 10. 🧪 **End-to-End Flow**

```
Producer → task_queue → Worker
```

### PRODUCER

Sends tasks reliably → persistent → durable queue.

### WORKER

Listens forever → processes → sends ACK.

### If worker fails

Message returns to queue → retried → no loss.

### If worker succeeds

Message is deleted permanently.

---

# 11. 🧾 **Summary Table (Everything Covered)**

| Feature                  | Producer | Worker |
| ------------------------ | -------- | ------ |
| Connect with credentials | ✔        | ✔      |
| Declare queue durable    | ✔        | ✔      |
| Send JSON tasks          | ✔        |        |
| Persistent messages      | ✔        |        |
| Receives messages        |          | ✔      |
| Manual ACK               |          | ✔      |
| NACK with retry          |          | ✔      |
| Fair dispatch            |          | ✔      |
| Requeue on crash         |          | ✔      |

---

