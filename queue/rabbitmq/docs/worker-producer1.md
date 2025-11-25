
# ## **2. Worker – Producer Model (Task Queue / Work Queue)**

### ### **Overview**

In this pattern, a producer doesn’t send messages to just one consumer —
instead, **multiple workers** compete for messages in the same queue.

This is used for:

* background job processing
* CPU-intensive tasks
* data pipelines
* video/image processing

Example:
1 producer → 5 workers
Each worker gets 1 message at a time.

---

## **2.1 Durable Queue (Tasks Survive RabbitMQ Restart)**

To avoid losing tasks when RabbitMQ restarts:

```python
channel.queue_declare(queue='task_queue', durable=True)
```

This makes the **queue** persistent (stored on disk).

---

## **2.2 Persistent Messages (Message Survive Restart)**

To mark messages as durable:

```python
properties=pika.BasicProperties(
    delivery_mode=pika.DeliveryMode.Persistent
)
```

This means messages are saved to disk (not only RAM).

---

## **2.3 Worker Processes Tasks (JSON Body Example)**

Worker receives raw bytes:

```python
def callback(ch, method, properties, body):
    data = json.loads(body)   # bytes → JSON → Python dict
```

Example JSON message:

```json
{"task": "sum", "start": 1, "end": 10000}
```

Workers can perform CPU-heavy jobs:

```python
if data["task"] == "sum":
    result = sum(range(data["start"], data["end"] + 1))
```

---

## **2.4 Manual Acknowledgement (Prevent Task Loss)**

If a worker crashes, we don't want tasks to vanish.

Add:

```python
ch.basic_ack(delivery_tag=method.delivery_tag)
```

This tells RabbitMQ:

> “This task is fully completed. You can delete it now.”

If worker dies before ack:
👉 RabbitMQ requeues the message.

---

## **2.5 Fair Dispatch (`prefetch=1`)**

Without fair dispatch:

* One worker may get many heavy tasks
* Another may get light tasks

To prevent overload:

```python
channel.basic_qos(prefetch_count=1)
```

Meaning:

> “Give me only one task at a time until I finish.”

This ensures **balanced load**.

---

## **2.6 Multiple Workers (Parallel Processing)**

You can run:

```
Terminal 1 → worker.py  
Terminal 2 → worker.py  
Terminal 3 → producer.py  
```

RabbitMQ splits tasks between workers:

* Worker 1 → handles task A
* Worker 2 → handles task B
* Worker 1 → gets task C after finishing A

This is the core of **distributed task processing**.

---

# ## **Final Summary**

### ### ✔ Producer–Consumer (Simple Model)

* exchange = "" (default exchange)
* direct routing to queue
* messages can be string or JSON
* queue must be declared
* used for simple pipelines

### ✔ Worker–Producer (Work Queue Model)

* used for background processing
* tasks distributed across multiple workers
* queue is durable → survives restart
* messages are persistent → survive restart
* workers use manual ack
* fair dispatch ensures load balancing

---
