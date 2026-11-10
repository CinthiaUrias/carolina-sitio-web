
<?php
header("Content-Type: application/json; charset=utf-8");

$host = getenv("DB_HOST");
$port = getenv("DB_PORT");
$db   = getenv("DB_NAME");
$user = getenv("DB_USER");
$pass = getenv("DB_PASSWORD");

try {
    $conexion = new PDO(
        "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    $sql = "CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";

    $conexion->exec($sql);

} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode([
        "error" => "No fue posible conectar con la base de datos."
    ]));
}
?>
