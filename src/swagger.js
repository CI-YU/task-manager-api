const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    version: '1.0.0',
    title: 'task-manager-api',
    description: '任務管理api實作',
  },
  host: 'billhuang-task-manager.herokuapp.com',
  schemes: ['https'],
  tags: [
    { name: 'users', description: 'user router' },
    { name: 'tasks', description: 'task router' },
  ],
  securityDefinitions: {
    Bearer: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
    },
  },
  definitions: {
    User: {
      $email: 'email@gmail.com',
      $password: 'yourpassword',
    },
    AddUser: {
      $name: 'Jahn',
      $email: 'riwkajv@gmail.com',
      $password: 'yourpassword',
    },
    task: {
      $description: '寫入代辦事項',
      $completed: false,
    },
  },
};
const outputFile = './swagger_output.json'; // 輸出的文件名稱
const endpointsFiles = ['src/app.js'];
swaggerAutogen(outputFile, endpointsFiles, doc); // swaggerAutogen 的方法
