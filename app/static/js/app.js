// ----------------------- Functions
async function getTasks() {
    try {
        const response = await fetch("/get-tasks");
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const data = await response.json();

        data.forEach((task) => {

            const id = task["id"];
            const title = task["title"];
            const completed = task["completed"];

            addTaskToList(id, title, completed);
        });
    } catch (error) {
        console.error("Error fetching tasks:", error);
    }
}

function addTaskToList(id, taskTitle, completed) {
    // vars
    const taskList = document.getElementById("task-list");

    const taskItem = document.createElement("li");
    const taskCheckbox = document.createElement("input");
    const title = document.createElement("span");
    const deleteItem = document.createElement("input");

    // set attributes and classes
    taskItem.id = id;
    taskItem.classList.add("task-item");

    title.classList.add("task-title");
    title.textContent = taskTitle;

    taskCheckbox.type = "checkbox";

    if (completed) {
        taskCheckbox.checked = true;
        title.classList.add("completed-task");
    }

    // set attributes and classes for delete button
    deleteItem.type = "button";
    deleteItem.value = "Delete";
    deleteItem.classList.add("btn", "btn-danger");

    // add event listeners
    taskCheckbox.addEventListener("change", completeTask);
    title.addEventListener("click", updateTaskTitle);
    deleteItem.addEventListener("click", deleteTask);

    // append elements
    taskItem.appendChild(taskCheckbox);
    taskItem.appendChild(title);
    taskItem.appendChild(deleteItem);

    taskList.appendChild(taskItem);
}

async function completeTask(event) {
    event.stopPropagation();

    const taskId = event.target.parentElement.id;
    const title = event.target.parentElement.querySelector(".task-title");
    const completedTask = event.target.checked;
    console.log("Completed =" + completedTask);
    if (event.target.checked) {
        title.classList.add("completed-task");
    } else {
        title.classList.remove("completed-task");
    }
    
    try {
        const url = "/update-task";
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: taskId,
                title: title.textContent,
                completed: completedTask
            })
        });

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
    } catch (error) {
        console.error("Error updating task:", error);
    }
}

async function deleteTask(event) {
    event.stopPropagation();

    const taskId = event.target.parentElement.id;
    try {
        const response = await fetch("/delete-task", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: taskId
            })
        });

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        const removedTaskId = result["id"];
        document.getElementById(removedTaskId).remove();
    } catch (error) {
        console.error(error.message);
    }
}


function duplicateTaskOutput(taskTitle) {
    const taskError = document.getElementById("task-error");
    taskError.textContent = `Task "${taskTitle}" already exists.`;
}

async function createNewTask(taskTitle) {
  const url = "/add-task";
  try {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: taskTitle
        })
    });

    const result = await response.json();
    const id = result["id"];
    const title = result["title"];
    const completed = result["completed"];

    if (response.status === 409){
        duplicateTaskOutput(taskTitle);
    }
    
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    addTaskToList(id, title, completed);

    console.log(result);
  } catch (error) {
    console.error(error.message);
  }
}

async function updateTaskTitle(event) {
    event.stopPropagation();

    const taskItem = event.currentTarget.parentElement;
    const taskId = parseInt(taskItem.id);
    const completedTask = taskItem.querySelector("input[type='checkbox']").checked;

    const title = taskItem.querySelector(".task-title");

    const input = document.createElement("input");
    input.type = "text";
    input.value = title.textContent;
    input.classList.add("task-edit-input");

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Save";
    saveButton.classList.add("btn", "btn-success");

    title.replaceWith(input);
    taskItem.appendChild(saveButton);

    input.focus();

    // Put the update logic in one function
    async function saveTask() {

        const newTitle = input.value.trim();

        if (!newTitle) {
            return;
        }

        try {

            const response = await fetch("/update-task", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: taskId,
                    title: newTitle,
                    completed: completedTask
                })
            });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const result = await response.json();

            console.log(result);

            const newTitleElement = document.createElement("span");

            newTitleElement.classList.add("task-title");
            newTitleElement.textContent = result.title;

            newTitleElement.addEventListener(
                "click",
                updateTaskTitle
            );

            input.replaceWith(newTitleElement);
            saveButton.remove();

        } catch (error) {
            console.error(error.message);
        }
    }

    // Save button
    saveButton.addEventListener("click", function(event) {
        event.stopPropagation();
        saveTask();
    });

    // Enter key
    input.addEventListener("keydown", function(event) {

        if (event.key === "Enter") {
            event.preventDefault();
            saveTask();
        }

    });
}

function clearError() {
    const taskError = document.getElementById("task-error");
    taskError.textContent = "";
}
// ----------------------- Main Execution
// Get all tasks on load
document.addEventListener("DOMContentLoaded", function () {
    getTasks();
});

// Add event listener to task input
const addTaskBtn = document.getElementById("getTaskTitleInput");

addTaskBtn.addEventListener("click", function(event) {
    event.preventDefault();
    const taskInput = document.getElementById("task-input");
    const taskTitle = taskInput.value.trim();
    console.log("Task Title:", taskTitle);
    createNewTask(taskTitle)

    // Clear the input field and error message after submission
    taskInput.value = "";
    clearError();
});
