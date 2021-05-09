const express = require('express');
const cors = require('cors');
const {v4: uuidv4} = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const {username} = request.headers;
  const user = users.find((user) => user.username === username);
  if (!user) {
    return response.status(404).json({error: 'Username not found!'});
  }
  request.user = user;
  return next();
}

app.post('/users', (request, response) => {
  const {name, username} = request.body;

  if (!(name)) {
    return response.status(400).json({error: "Name should be defined!"});
  }

  if (!(username)) {
    return response.status(400).json({error: "Username should be defined!"});
  }

  const userAlreadyExists = users.some(
    (user) => user.username === username
  )
  if (userAlreadyExists) {
    return response.status(400).json({error: "Username already exists!"});
  }

  const uuid = uuidv4()
  users.push({
    id: uuid,
    name,
    username,
    todos: []
  });
  const user = users.find((user) => user.id === uuid);
  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const {user} = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const {user} = request;
  const {title, deadline} = request.body;
  if (!title) {
    return response.status(400).json({error: 'Please define a title'});
  }

  if (!deadline) {
    return response.status(400).json({error: 'Please define a deadline in format \'YYYY-MM-DD\''});
  }

  const todo = {
    id: uuidv4(),
    title: title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(todo);
  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const {user} = request;
  const {id} = request.params;
  const {title, deadline} = request.body;
  const todos = user.todos;
  const todo = todos.find(todo => todo.id === id);
  if (!todo) {
    return response.status(404).json({error: "Todo not found!"});
  }
  if (title) {
    todo.title = title;
  }

  if (deadline) {
    todo.deadline = new Date(deadline);
  }

  return response.json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const {user} = request;
  const {id} = request.params;
  const todos = user.todos;
  const todo = todos.find(todo => todo.id === id);
  if (!todo) {
    return response.status(404).json({error: "Todo not found!"});
  }

  todo.done = true;
  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const {user} = request;
  const {id} = request.params;
  const todos = user.todos;
  const todoIndex = todos.findIndex(todo => todo.id === id);
  if (todoIndex === -1) {
    return response.status(404).json({error: "Todo not found!"});
  }

  todos.splice(todoIndex, 1);
  return response.status(204).json();
});

module.exports = app;