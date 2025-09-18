import { useState, useEffect } from "react";
import "./App.css";

function App() {
	const [info, setInfo] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetch("/api/info")
			.then((res) => {
				if (!res.ok) throw new Error("Network response was not ok");
				return res.json();
			})
			.then((data) => {
				setInfo(data);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, []);

	return (
		<>
			<h1>J26 Infra test and demo</h1>
			<h2>Call /api/info</h2>
			{loading && <p>Loading...</p>}
			{error && <p style={{ color: "red" }}>Error: {error}</p>}
			{info && (
				<table style={{ borderCollapse: "collapse", marginTop: "1em" }}>
					<thead>
						<tr>
							<th style={{ border: "1px solid #ccc", padding: "8px" }}>Key</th>
							<th style={{ border: "1px solid #ccc", padding: "8px" }}>
								Value
							</th>
						</tr>
					</thead>
					<tbody>
						{Object.entries(info).map(([key, value]) => (
							<tr key={key}>
								<td
									style={{
										border: "1px solid #ccc",
										padding: "8px",
										fontWeight: "bold",
									}}
								>
									{key}
								</td>
								<td style={{ border: "1px solid #ccc", padding: "8px" }}>
									{String(value)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</>
	);
}

export default App;
