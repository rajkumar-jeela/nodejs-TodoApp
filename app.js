const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertTodoDbObjectToResponseObject = (eachTodo) => {
  return {
    id: eachTodo.id,
    todo: eachTodo.todo,
    priority: eachTodo.priority,
    status: eachTodo.status,
    category: eachTodo.category,
    dueDate: eachTodo.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  let todosArray = null;
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      todosArray = await database.all(getTodosQuery);
      if (todosArray.length > 0) {
        response.send(
          todosArray.map((each) => convertTodoDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;

      todosArray = await database.all(getTodosQuery);
      if (todosArray.length > 0) {
        response.send(
          todosArray.map((each) => convertTodoDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;

      todosArray = await database.all(getTodosQuery);
      if (todosArray.length > 0) {
        response.send(
          todosArray.map((each) => convertTodoDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        AND status = '${status}';`;

      todosArray = await database.all(getTodosQuery);
      if (todosArray.length > 0) {
        response.send(
          todosArray.map((each) => convertTodoDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      todosArray = await database.all(getTodosQuery);
      if (todosArray.length > 0) {
        response.send(
          todosArray.map((each) => convertTodoDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        AND priority = '${priority}';`;
      todosArray = await database.all(getTodosQuery);
      if (todosArray.length > 0) {
        response.send(
          todosArray.map((each) => convertTodoDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
      todosArray = await database.all(getTodosQuery);
      response.send(
        todosArray.map((each) => convertTodoDbObjectToResponseObject(each))
      );
  }
});

//2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todoArray = await database.get(getTodoQuery);
  response.send(convertTodoDbObjectToResponseObject(todoArray));
});

//3

app.get("/agenda/", async (request, response) => {
  const { date, search_q = "" } = request.query;
  if (date.length >= 8 && date.length <= 10) {
    const fullDate = new Date(date);
    const year = fullDate.getFullYear();
    const month = fullDate.getMonth();
    const day = fullDate.getDate();

    const format = require("date-fns/format");
    const newDate = format(new Date(year, month, day), "yyyy-MM-dd");
    //console.log(newDate.length);
    const getDateQuery = `
  SELECT 
  *
  FROM 
  todo
  WHERE
  todo LIKE '%${search_q}%' AND
  due_date = '${newDate}';
  `;
    const dateArray = await database.all(getDateQuery);
    if (dateArray.length > 0) {
      response.send(
        dateArray.map((eachArray) =>
          convertTodoDbObjectToResponseObject(eachArray)
        )
      );
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//middleWear

const verify = (request, response, next) => {
  if (request.body.status !== undefined) {
    if (
      request.body.status === "TO DO" ||
      request.body.status === "IN PROGRESS" ||
      request.body.status === "DONE"
    ) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  if (request.body.priority !== undefined) {
    if (
      request.body.priority === "HIGH" ||
      request.body.priority === "MEDIUM" ||
      request.body.priority === "LOW"
    ) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  if (request.body.dueDate !== undefined) {
    if (request.body.dueDate !== undefined) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }

  if (request.body.category !== undefined) {
    if (
      request.body.category === "WORK" ||
      request.body.category === "HOME" ||
      request.body.category === "LEARNING"
    ) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (request.body.todo !== undefined) {
    next();
  }
};

//4

app.post("/todos/", async (request, response) => {
  const bookDetails = request.body;
  const { id, todo, priority, status, category, due_date } = bookDetails;
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const postTodoQuery = `
  INSERT INTO
    todo (id, todo, category,priority, status,due_date)
  VALUES
    (${id}, '${todo}','${category}', '${priority}', '${status}'   , '${due_date}');`;
        await database.run(postTodoQuery);
        response.send("Todo Successfully Added");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send(`Invalid Todo Priority`);
    }
  } else {
    response.status(400);
    response.send(`Invalid Todo Status`);
  }
});

//5

app.put("/todos/:todoId/", verify, async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
  }

  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    due_date = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category= '${category}',
      due_date ='${due_date}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;