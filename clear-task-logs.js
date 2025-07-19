// Temporary script to clear all task logs
// Run this in your browser console after signing in

const clearTaskLogs = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    console.log("Clearing all task logs...");
    
    const { data, error } = await supabase
      .from('task_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (error) {
      console.error("Error clearing task logs:", error);
    } else {
      console.log("Task logs cleared successfully!");
      console.log("Deleted rows:", data);
    }
  } else {
    console.log("No authenticated user found");
  }
};

// Run this function
clearTaskLogs(); 