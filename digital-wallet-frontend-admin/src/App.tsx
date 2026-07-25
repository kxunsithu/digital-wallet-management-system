import { RouterProvider } from "react-router-dom";
import router from "./routes/router";
import ToasterProvider from "./components/ui/ToasterProvider";

function App() {
  return (
    <div className="admin-portal">
      <RouterProvider router={router} />
      <ToasterProvider />
    </div>
  );
}

export default App;
