from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for
)

from app import db
from app.models.task import Task

tasks_bp = Blueprint("tasks_bp", __name__)

@tasks_bp.route("/")
def home():
    return render_template("index.html")

@tasks_bp.route("/get-tasks", methods=["GET"])
def get_tasks():

    tasks = Task.query.all()

    return [
        {
            "id": task.id,
            "title": task.title,
            "completed": task.completed
        }
        for task in tasks
    ], 200

@tasks_bp.route("/add-task", methods=["POST"])
def add_task():

    if request.method == "POST":
        data = request.json
        task_name = data["title"]
        found_task = Task.query.filter_by(title=task_name).first()
        if found_task:
            return {
                "message": f"Task {task_name} already exists"
            }, 409
        
        task = Task(title=task_name)
        db.session.add(task)
        db.session.commit()

    return {
        "id": task.id,
        "title": task.title,
        "completed": task.completed
    }, 201

@tasks_bp.route("/update-task", methods=["PUT"])
def update_task():
    print("UPDATE ROUTE HIT")

    data = request.json
    print("DATA:", data)
    task_id = data["id"]
    title = data["title"]
    completed = data["completed"]

    task = db.session.get(Task, int(task_id))
    task.title = title
    task.completed = completed
    db.session.commit()
    return {
        "id": task.id,
        "title": task.title,
        "completed": task.completed
    }, 200

@tasks_bp.route("/delete-task", methods=["DELETE"])
def delete_task():
    data = request.json
    print("Received data:", data)

    task_id = data["id"]
    print("Task ID:", task_id)

    task = db.session.get(Task, int(task_id))
  
    if not task:
        return {"message": "Task not found"}, 404

    db.session.delete(task)
    db.session.commit()

    return {"id": task_id}, 200

@tasks_bp.route("/delete-all")
def delete_all_tasks():

    Task.query.delete()
    db.session.commit()

    return redirect(url_for("tasks_bp.home"))
