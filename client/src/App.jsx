import { useState, useEffect } from "react";
import "./App.css";

const buildApiPath = (endpoint) => {
	if (typeof window === "undefined") return endpoint;

	const [firstSegment] = window.location.pathname.split("/").filter(Boolean);
	const basePath = firstSegment ? `/${firstSegment}` : "";
	const normalisedEndpoint = endpoint.startsWith("/")
		? endpoint
		: `/${endpoint}`;
	return `${basePath}${normalisedEndpoint}`;
};

function App() {
	const [info, setInfo] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [cookies, setCookies] = useState(null);
	const [cookiesLoading, setCookiesLoading] = useState(true);
	const [cookiesError, setCookiesError] = useState(null);

	useEffect(() => {
		fetch(buildApiPath("/api/info"))
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

	// Fetch cookies separately
	useEffect(() => {
		fetch(buildApiPath("/api/cookies"))
			.then((res) => {
				if (!res.ok) throw new Error("Network response was not ok");
				return res.json();
			})
			.then((data) => {
				setCookies(data);
				setCookiesLoading(false);
			})
			.catch((err) => {
				setCookiesError(err.message);
				setCookiesLoading(false);
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
			<h2>Call /api/cookies</h2>
			{cookiesLoading && <p>Loading...</p>}
			{cookiesError && <p style={{ color: "red" }}>Error: {cookiesError}</p>}
			{cookies && Object.keys(cookies).length === 0 && (
				<p>No cookies present</p>
			)}
			{cookies && Object.keys(cookies).length > 0 && (
				<table style={{ borderCollapse: "collapse", marginTop: "1em" }}>
					<thead>
						<tr>
							<th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
							<th style={{ border: "1px solid #ccc", padding: "8px" }}>
								Value
							</th>
						</tr>
					</thead>
					<tbody>
						{Object.entries(cookies).map(([name, value]) => (
							<tr key={name}>
								<td
									style={{
										border: "1px solid #ccc",
										padding: "8px",
										fontWeight: "bold",
									}}
								>
									{name}
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
