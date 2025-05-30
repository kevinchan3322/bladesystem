db = db.getSiblingDB('admin');

// Create admin user
db.createUser({
  user: 'admin',
  pwd: 'admin_password',  // This will be overridden by environment variables
  roles: [{ role: 'userAdminAnyDatabase', db: 'admin' }]
});

// Create application database and user
db = db.getSiblingDB('bladesystem');

db.createUser({
  user: 'blade_user',
  pwd: 'blade_password',  // This will be overridden by environment variables
  roles: [
    { role: 'readWrite', db: 'bladesystem' },
    { role: 'dbAdmin', db: 'bladesystem' }
  ]
});

// Create collections
db.createCollection('users');
db.createCollection('predictions');
db.createCollection('blade_specifications');
db.createCollection('machine_specifications');
db.createCollection('work_orders');
db.createCollection('prediction_results');
db.createCollection('prediction_feedback');
db.createCollection('user_logs');

// Create indexes
db.predictions.createIndex({ "created_at": 1 });
db.prediction_results.createIndex({ "machine_id": 1 });
db.prediction_results.createIndex({ "prediction_date": 1 });
db.user_logs.createIndex({ "timestamp": 1 });
db.work_orders.createIndex({ "order_date": 1 }); 