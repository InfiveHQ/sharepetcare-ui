// Temporary script to create user record
// Run this in your browser console after signing in

const createUserRecord = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    console.log("Creating user record for:", user.email);
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0]
        }
      ]);
    
    if (error) {
      console.error("Error creating user record:", error);
    } else {
      console.log("User record created successfully!");
    }
  } else {
    console.log("No authenticated user found");
  }
};

// Run this function
createUserRecord(); 