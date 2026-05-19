--- packages/client/src/pages/SignupPage.tsx
+++ packages/client/src/pages/SignupPage.tsx
@@ -15,7 +15,7 @@

   const signupMutation = trpc.auth.signup.useMutation({
     onSuccess: (data) => {
-      localStorage.setItem('token', data.token);
+      localStorage.setItem('authToken', data.token);
       navigate('/dashboard');
     },
     onError: (error) => {
