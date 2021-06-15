const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
require('./db/mongoose.js');
const userRouter = require('./router/user');
const taskRouter = require('./router/task');
const swaggerUi = require('swagger-ui-express');
const output = require('../swagger_output.json');

const app = express();

app.use(compression());
app.use(helmet());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(output));
app.use('/users', userRouter);
app.use('/tasks', taskRouter);

module.exports = app;
