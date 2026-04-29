import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const API = import.meta.env.VITE_API_URL;

export default function Insights() {
  const [view, setView] = useState("table");
  const [bpReadings, setBpReadings] = useState<any[]>([]);
  const [glucoseReadings, setGlucoseReadings] = useState<any[]>([]);

  useEffect(() => {
    async function fetchReadings() {
      const response = await fetch(`${API}/api/bp-readings`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBpReadings(data.readings);
      } else if (response.status === 401) {
        alert("Unauthorized. Please log in again.");
      }

      const response2 = await fetch(`${API}/api/glucose-readings`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response2.ok) {
        const data = await response2.json();
        setGlucoseReadings(data.readings);
      } else if (response2.status === 401) {
        alert("Unauthorized. Please log in again.");
      }
    }

    fetchReadings();
  }, []);

  const fastingReadings = glucoseReadings.filter((r) => r.type === "fasting");
  const postMealReadings = glucoseReadings.filter(
    (r) => r.type === "post_meal",
  );

  return (
    <Tabs defaultValue="bp">
      <TabsList className="bg-blue-100">
        <TabsTrigger value="bp">Blood Pressure</TabsTrigger>
        <TabsTrigger value="glucose">Glucose</TabsTrigger>
        <TabsTrigger value="weight">Weight</TabsTrigger>
      </TabsList>
      <div className="flex space-x-2 mb-4 mt-4">
        <Button
          size="sm"
          variant={view === "table" ? "default" : "outline"}
          onClick={() => setView("table")}
        >
          Table View
        </Button>
        <Button
          size="sm"
          variant={view === "graph" ? "default" : "outline"}
          onClick={() => setView("graph")}
        >
          Graph View
        </Button>
      </div>
      <TabsContent value="bp">
        {view === "table" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Systolic</TableHead>
                <TableHead>Diastolic</TableHead>
                <TableHead>Pulse</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bpReadings.map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell>
                    {new Date(reading.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(reading.created_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>{reading.systolic}</TableCell>
                  <TableCell>{reading.diastolic}</TableCell>
                  <TableCell>{reading.pulse ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={bpReadings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="created_at"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="systolic"
                stroke="#3b82f6"
                name="Systolic"
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="#ef4444"
                name="Diastolic"
              />
              <Line
                type="monotone"
                dataKey="pulse"
                stroke="#22c55e"
                name="Pulse"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </TabsContent>

      <TabsContent value="glucose">
        {view === "table" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reading (mg/dL)</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {glucoseReadings.map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell>
                    {new Date(reading.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{reading.reading}</TableCell>
                  <TableCell>
                    {reading.type === "post_meal" ? "Post Meal" : "Fasting"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Fasting</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={fastingReadings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="created_at"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="reading"
                    stroke="#3b82f6"
                    name="Fasting"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Post Meal</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={postMealReadings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="created_at"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="reading"
                    stroke="#ef4444"
                    name="Post Meal"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </TabsContent>
      <TabsContent value="weight">
        <p>Weight Reports coming soon...</p>
      </TabsContent>
    </Tabs>
  );
}
