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

export default function Reports() {
  const [bpReadings, setBpReadings] = useState<any[]>([]);
  const [glucoseReadings, setGlucoseReadings] = useState<any[]>([]);

  useEffect(() => {
    async function fetchReadings() {
      const response = await fetch("http://localhost:3000/api/bp-readings", {
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

      const response2 = await fetch(
        "http://localhost:3000/api/glucose-readings",
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

  return (
    <Tabs defaultValue="bp">
      <TabsList>
        <TabsTrigger value="bp">Blood Pressure</TabsTrigger>
        <TabsTrigger value="glucose">Glucose</TabsTrigger>
        <TabsTrigger value="weight">Weight</TabsTrigger>
        <TabsTrigger value="blood-test">Blood Test</TabsTrigger>
      </TabsList>

      <TabsContent value="bp">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
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
                <TableCell>{reading.systolic}</TableCell>
                <TableCell>{reading.diastolic}</TableCell>
                <TableCell>{reading.pulse ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="glucose">
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
                <TableCell>{new Date(reading.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{reading.reading}</TableCell>
                <TableCell>{reading.type === "post_meal" ? "Post Meal" : "Fasting"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="weight">
        <p>Weight Reports coming soon...</p>
      </TabsContent>
      <TabsContent value="blood-test">
        <p>Blood Test Reports coming soon...</p>
      </TabsContent>
    </Tabs>
  );
}
