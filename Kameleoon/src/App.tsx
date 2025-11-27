import './App.css';
import Chart from "./components/Chart";
import ControlPanel from "./components/ControlPanel";
import { AppProvider } from "./providers/AppProvider.tsx";
import { useEffect, useState } from "react";
import type ChartInterface from "./types/ChartTypes.ts";

function App() {
    const [data, setData] = useState<ChartInterface>(null);

    useEffect(() => {
        fetch("/data.json")
            .then(res => res.json())
            .then(json => setData(json))
            .catch(err => console.error(err));
    }, []);

    return (
        <AppProvider>
            { data && <>
                        <ControlPanel data={data}/>
                        <Chart data={data}/>
                    </>
            }
        </AppProvider>
    )
}

export default App
