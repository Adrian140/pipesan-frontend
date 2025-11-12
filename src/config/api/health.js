import { supabase } from '../supabase';

// Database health check and error handling utilities
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Database connection test successful');
    return { success: true, data };
  } catch (err) {
    console.error('Database connection error:', err);
    return { success: false, error: err.message };
  }
};

export const checkTablesExist = async () => {
  try {
    const requiredTables = ['users', 'products', 'categories', 'orders', 'content'];
    const results = {};
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        results[table] = error ? false : true;
        if (error) {
          console.error(`Table ${table} check failed:`, error);
        }
      } catch (err) {
        console.error(`Error checking table ${table}:`, err);
        results[table] = false;
      }
    }
    
    return results;
  } catch (err) {
    console.error('Error checking tables:', err);
    return {};
  }
};

export const handleDatabaseError = async (error, operation, retries = 2) => {
  console.error(`Database error in ${operation}:`, error);
  
  if (retries > 0 && (error.message.includes('connection') || error.message.includes('timeout'))) {
    console.log(`Retrying ${operation}... (${retries} retries left)`);
    await delay(1000);
    return null; // Signal to retry
  }
  
  if (error.message.includes('relation') || error.message.includes('does not exist')) {
    const tablesCheck = await checkTablesExist();
    console.log('Tables check result:', tablesCheck);
    throw new Error(`Database schema error: ${error.message}. Missing tables detected.`);
  }
  
  throw new Error(`${operation} failed: ${error.message}`);
};

export const healthCheck = async () => {
  try {
    console.log('Checking database health...');
    
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest.success) {
      throw new Error(`Connection failed: ${connectionTest.error}`);
    }
    
    const tablesCheck = await checkTablesExist();
    const missingTables = Object.entries(tablesCheck)
      .filter(([table, exists]) => !exists)
      .map(([table]) => table);
    
    if (missingTables.length > 0) {
      console.warn('Missing tables:', missingTables);
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    console.log('Database health check passed');
    return { success: true };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { success: false, error: error.message };
  }
};
