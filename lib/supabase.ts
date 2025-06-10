// File: lib/supabase.ts

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecvrdcijhdhobjtbtrcl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdnJkY2lqaGRob2JqdGJ0cmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNTU0NjksImV4cCI6MjA2NDkzMTQ2OX0.RhVhDm6MRreFsmbex_QVwiE08unLLb6wYjsH1FVAGVg';

// This is the line that creates the client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 
// THIS IS THE MOST IMPORTANT LINE - MAKE SURE IT EXISTS!
//
export { supabase };