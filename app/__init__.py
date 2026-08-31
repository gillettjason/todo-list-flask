import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()

def create_app():

    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ["SECRET_KEY"]

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tasks.db"

    db.init_app(app)

    from app.models.task import Task

    with app.app_context():
        db.create_all()

    from app.routes.tasks import tasks_bp
    app.register_blueprint(tasks_bp)

    return app
