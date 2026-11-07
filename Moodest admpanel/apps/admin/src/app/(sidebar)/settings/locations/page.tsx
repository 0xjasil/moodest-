"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Plus, Search } from "lucide-react";

const initialLocations = [
  {
    id: "l1",
    name: "Bengaluru Warehouse",
    city: "Bengaluru",
    manager: "Priya Nair",
    stock: 1840,
    status: "Active",
  },
  {
    id: "l2",
    name: "Mumbai Flagship Store",
    city: "Mumbai",
    manager: "Rohan Mehta",
    stock: 412,
    status: "Active",
  },
  {
    id: "l3",
    name: "Delhi Fulfilment Centre",
    city: "New Delhi",
    manager: "Simran Kaur",
    stock: 967,
    status: "Active",
  },
  {
    id: "l4",
    name: "Chennai Pop-up",
    city: "Chennai",
    manager: "Arjun Iyer",
    stock: 58,
    status: "Paused",
  },
];

export default function LocationsSettingsPage() {
  const [search, setSearch] = useState("");

  const filtered = initialLocations.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
              <p className="text-muted-foreground">
                Warehouses and retail stores fulfilling orders
              </p>
            </div>
            <Button
              onClick={() => toast.success("Location added (demo)")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> All Locations
                  </CardTitle>
                  <CardDescription>
                    {filtered.length} of {initialLocations.length} locations
                  </CardDescription>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search locations"
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Stock Units</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {l.city}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {l.manager}
                      </TableCell>
                      <TableCell>{l.stock.toLocaleString()}</TableCell>
                      <TableCell>
                        {l.status === "Active" ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                          >
                            Paused
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No locations match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
