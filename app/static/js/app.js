// -----------------------
// DOM Elements
// -----------------------

const taskList = document.getElementById("task-list");
const taskInput = document.getElementById("task-input");
const addTaskBtn = document.getElementById("getTaskTitleInput");
const taskError = document.getElementById("task-error");

// -----------------------
// API Functions
// -----------------------
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

        const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message || `Response status: ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return data;
}

async function getTasks() {
    try {
        const tasks = await apiRequest("/get-tasks");

        tasks.forEach((task) => {

            addTaskToList(task);
        });
    } catch (error) {
        console.error("Error fetching tasks:", error);
    }
}

async function completeTask(event) {
    event.stopPropagation();

    const taskItem = event.currentTarget.parentElement;
    const taskId = taskItem.id;
    const title = taskItem.querySelector(".task-title");
    const completedTask = event.currentTarget.checked;

    if (completedTask) {
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

    await apiRequest("/delete-task", {
        method: "DELETE",
        body: JSON.stringify({
            id: taskId
        })
    });

    document.getElementById(taskId).remove();
}

async function newTask(taskTitle) {
    try {
        const result = await apiRequest("/add-task", {
            method: "POST",
            body: JSON.stringify({
                title: taskTitle
            })
        });

        addTaskToList(result);
        return true;

    } catch (error) {
        if (error.status === 409) {
            duplicateTaskOutput(taskTitle);
            return false;
        }

        console.error(error.message);
        return false;
    }
}

async function updateTitle(event) {
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

            const newTitleElement = createTaskTitle(result.title, result.completed);
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

// -----------------------
// Handlers
// -----------------------
async function handleAddTask(event) {
    event.preventDefault();

    const taskTitle = taskInput.value.trim();

    if (!taskTitle) {
        return;
    }

    const success = await newTask(taskTitle);

    if (success) {
        taskInput.value = "";
        clearError();
    }
}

// -----------------------
// UI Functions
// -----------------------
function createTaskTitle(titleText, completed) {
    const title = document.createElement("span");

    title.classList.add("task-title");
    title.textContent = titleText;

    if (completed) {
        title.classList.add("completed-task");
    }

    title.addEventListener("click", updateTitle);

    return title;
}

function addTaskToList(task) {
    // vars
    const {id, taskTitle, completed} = task;

    const taskItem = document.createElement("li");
    const taskCheckbox = document.createElement("input");
    const title = createTaskTitle(task.title, task.completed);
    const deleteItem = document.createElement("input");

    // set attributes and classes
    taskItem.id = id;
    taskItem.classList.add("task-item");

    taskCheckbox.type = "checkbox";
    taskCheckbox.classList.add("task-checkbox");

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
    deleteItem.addEventListener("click", deleteTask);

    // append elements
    taskItem.appendChild(taskCheckbox);
    taskItem.appendChild(title);
    taskItem.appendChild(deleteItem);

    taskList.appendChild(taskItem);
}

function duplicateTaskOutput(taskTitle) {
    taskError.textContent = `Task "${taskTitle}" already exists.`;
}

function clearError() {
    taskError.textContent = "";
}
// ----------------------- Main Execution
// Get all tasks on load
getTasks();

// Add event listener to task input
addTaskBtn.addEventListener("click", handleAddTask);
