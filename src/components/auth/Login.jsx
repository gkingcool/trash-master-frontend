// // src/components/auth/Login.jsx
// import React, { useState } from "react";
// import "./login.css";
// import logo from "../../assets/icons/recycling-icon.png";
// import truck from "../../assets/icons/truck.png";

// const Login = ({ onLoginSuccess }) => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     // ✅ Support both Admin and Driver logins
//     if (username === "admin" && password === "password") {
//       localStorage.setItem(
//         "auth",
//         JSON.stringify({
//           isAuthenticated: true,
//           role: "Admin",
//         }),
//       );
//       onLoginSuccess();
//     } else if (username === "driver" && password === "driverpass") {
//       localStorage.setItem(
//         "auth",
//         JSON.stringify({
//           isAuthenticated: true,
//           role: "Driver",
//         }),
//       );
//       onLoginSuccess();
//     } else {
//       setError(
//         "Invalid credentials. Try: admin/password or driver1/driverpass",
//       );
//     }
//   };

//   return (
//     <div className="login-container">
//       <div className="left-panel">
//         <img src={truck} alt="truck" className="truck-image" />
//       </div>

//       <div className="right-panel">
//         <div className="header">
//           <img src={logo} alt="Logo" className="logo-icon" />
//           <h1>Trash Master Co.</h1>
//         </div>

//         <div className="form-container">
//           <div className="login-form">
//             <h2>Welcome Back</h2>
//             <p>Please enter your login</p>

//             {error && (
//               <p style={{ color: "red", marginBottom: "15px" }}>{error}</p>
//             )}

//             <form onSubmit={handleSubmit}>
//               <div className="form-group">
//                 <label htmlFor="username">User Name or Email Address</label>
//                 {/* ✅ Added placeholder showing test usernames */}
//                 <input
//                   type="text"
//                   id="username"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                   placeholder="admin or driver1" /* ← Minimal change */
//                 />
//               </div>

//               <div className="form-group">
//                 <label htmlFor="password">Password</label>
//                 {/* ✅ Added placeholder showing test password */}
//                 <input
//                   type="password"
//                   id="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="password" /* ← Minimal change */
//                 />
//               </div>

//               <button type="submit" className="login-button">
//                 Login
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;
// src/components/auth/Login.jsx
import React, { useState } from "react";
import "./login.css";
import logo from "../../assets/icons/recycling-icon.png";
import truck from "../../assets/icons/truck.png";

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👁️ Toggle state

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username === "admin" && password === "password") {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          isAuthenticated: true,
          role: "Admin",
        }),
      );
      onLoginSuccess();
    } else if (username === "driver" && password === "driverpass") {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          isAuthenticated: true,
          role: "Driver",
        }),
      );
      onLoginSuccess();
    } else {
      setError("Invalid credentials. Try: admin/password or driver/driverpass");
    }
  };

  return (
    <div className="login-container">
      <div className="left-panel">
        <img src={truck} alt="truck" className="truck-image" />
      </div>

      <div className="right-panel">
        <div className="header">
          <img src={logo} alt="Logo" className="logo-icon" />
          <h1>Trash Master Co.</h1>
        </div>

        <div className="form-container">
          <div className="login-form">
            <h2>Welcome Back</h2>
            <p>Please enter your login</p>

            {error && (
              <p style={{ color: "red", marginBottom: "15px" }}>{error}</p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">User Name or Email Address</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or driver"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>

                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    className="password-input"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}{" "}
                    {/* 👁️ Open eye / 👁️‍🗨️ Closed eye */}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-button">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
