// import GoogleProvider from 'next-auth/providers/google';
// import CredentialsProvider from 'next-auth/providers/credentials';

// export const authOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID || 'demo-client-id',
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-client-secret',
//     }),
//     CredentialsProvider({
//       name: 'Credentials',
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         if (credentials?.email === 'admin@transsacaba.com' && credentials?.password === 'admin123') {
//           return {
//             id: '1',
//             name: 'Admin Trans Sacaba',
//             email: 'admin@transsacaba.com',
//             role: 'admin'
//           };
//         }
//         if (credentials?.email && credentials?.password) {
//           return {
//             id: '2',
//             name: 'Usuario Demo',
//             email: credentials.email,
//             role: 'user'
//           };
//         }
//         return null;
//       }
//     })
//   ],
//   pages: {
//     signIn: '/login',
//   },
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.role = user.role || 'user';
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (session?.user) {
//         session.user.role = token.role;
//       }
//       return session;
//     },
//   },
//   secret: process.env.NEXTAUTH_SECRET || 'super-secret-key-for-dev',
// };
