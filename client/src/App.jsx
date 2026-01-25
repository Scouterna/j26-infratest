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
	const [user, setUser] = useState(null);
	const [userLoading, setUserLoading] = useState(true);
	const [userError, setUserError] = useState(null);
	const [needsLogin, setNeedsLogin] = useState(false);

	// Helper: decode percent-encoded cookie values safely
	const safeDecode = (val) => {
		try {
			return decodeURIComponent(String(val));
		} catch {
			return String(val);
		}
	};

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
		// include cookies on the request so the server receives them
		fetch(buildApiPath("/api/cookies"), { credentials: "include" })
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

	// Fetch user data with auth refresh logic
	useEffect(() => {
		const fetchUser = async () => {
			try {
				// Try to fetch user data
				const userRes = await fetch(buildApiPath("/api/user"), {
					credentials: "include",
				});

				// If unauthorized, try to refresh the token
				if (userRes.status === 401) {
					const refreshRes = await fetch("/auth/refresh", {
						credentials: "include",
					});

					// If refresh succeeded, retry fetching user data
					if (refreshRes.ok) {
						const retryRes = await fetch(buildApiPath("/api/user"), {
							credentials: "include",
						});

						if (retryRes.ok) {
							const data = await retryRes.json();
							setUser(data);
							setUserLoading(false);
							return;
						}
					}

					// If refresh failed or retry failed, user needs to login
					setNeedsLogin(true);
					setUserLoading(false);
					return;
				}

				// If the response was ok, parse and set user data
				if (userRes.ok) {
					const data = await userRes.json();
					setUser(data);
					setUserLoading(false);
				} else {
					throw new Error("Network response was not ok");
				}
			} catch (err) {
				setUserError(err.message);
				setUserLoading(false);
			}
		};

		fetchUser();
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
								<td
									style={{
										border: "1px solid #ccc",
										padding: "8px",
										textAlign: "left",
										wordBreak: "break-all",
									}}
								>
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
								<td
									style={{
										border: "1px solid #ccc",
										padding: "8px",
										textAlign: "left",
										wordBreak: "break-all",
									}}
								>
									{safeDecode(value)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
			<h2>Call /api/user</h2>
			{userLoading && <p>Loading...</p>}
			{userError && <p style={{ color: "red" }}>Error: {userError}</p>}
			{needsLogin && (
				<button
					type="button"
					onClick={() => {
						const currentPage = encodeURIComponent(window.location.href);
						window.location.href = `/auth/login?redirect_uri=${currentPage}`;
					}}
					style={{
						padding: "10px 20px",
						fontSize: "16px",
						cursor: "pointer",
						backgroundColor: "#007bff",
						color: "white",
						border: "none",
						borderRadius: "4px",
						marginTop: "1em",
					}}
				>
					Login
				</button>
			)}
			{user && (
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
						{Object.entries(user).map(([key, value]) => (
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
								<td
									style={{
										border: "1px solid #ccc",
										padding: "8px",
										textAlign: "left",
										wordBreak: "break-all",
									}}
								>
									{Array.isArray(value) ? value.join(", ") : String(value)}
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
