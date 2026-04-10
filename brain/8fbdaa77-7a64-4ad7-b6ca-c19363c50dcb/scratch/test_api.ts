async function testBackend() {
  const baseUrl = "http://localhost:8080/api";
  
  try {
    // 1. Create a certificate
    const createRes = await fetch(`${baseUrl}/certificates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // We'll skip admin auth for this local test if we can, or we'll see if it fails
      },
      body: JSON.stringify({
        learnerName: "Test Learner",
        courses: "Test Course",
        dateIssued: "2026-04-10",
        duration: "3 months",
        email: "test@example.com"
      })
    });
    
    const createData = await createRes.json();
    console.log("Create Certificate:", createData);
    
    if (createData.id) {
       // 2. Fetch it
       const getRes = await fetch(`${baseUrl}/certificates/${createData.id}`);
       const getData = await getRes.json();
       console.log("Get Certificate:", getData);
    }
    
  } catch (e) {
    console.error("Test failed:", e);
  }
}

testBackend();
