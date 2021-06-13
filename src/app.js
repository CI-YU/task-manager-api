const express = require('express');
require('./db/mongoose.js');
const userRouter = require('./router/user');
const taskRouter = require('./router/task');
const swaggerUi = require('swagger-ui-express');
const output = require('../swagger_output.json');

const app = express();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(output));

app.use(express.json());
app.use('/users', userRouter);
app.use('/tasks', taskRouter);

module.exports = app;
