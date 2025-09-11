import Login from "./components/Login";
import PatientDashboard from "./components/Patient_dash";
import { Route,Routes } from "react-router-dom";

function App() {
  return (
    <div className="">
      
      <Routes>
        <Route path="/" element = {<Login/>}/>

        <Route path="/patient" element = {<PatientDashboard/>}/>

      </Routes>
    </div>
  );
}

export default App;
