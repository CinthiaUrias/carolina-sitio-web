<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

require_once "conexion.php";

$metodo = $_SERVER["REQUEST_METHOD"];

try {
    switch ($metodo) {
        case "GET":
            if (isset($_GET["id"])) {
                $stmt = $conexion->prepare(
                    "SELECT * FROM productos WHERE id = ?"
                );
                $stmt->execute([$_GET["id"]]);
                $resultado = $stmt->fetch();
            } else {
                $stmt = $conexion->query(
                    "SELECT * FROM productos ORDER BY id DESC"
                );
                $resultado = $stmt->fetchAll();
            }
            echo json_encode($resultado);
            break;

        case "POST":
            $datos = json_decode(file_get_contents("php://input"), true);
            $stmt = $conexion->prepare(
                "INSERT INTO productos (nombre, descripcion, precio)
                 VALUES (?, ?, ?)"
            );
            $stmt->execute([
                $datos["nombre"],
                $datos["descripcion"] ?? "",
                $datos["precio"]
            ]);
            echo json_encode(["mensaje" => "Producto agregado correctamente"]);
            break;

        case "PUT":
            $datos = json_decode(file_get_contents("php://input"), true);
            $stmt = $conexion->prepare(
                "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?
                 WHERE id = ?"
            );
            $stmt->execute([
                $datos["nombre"],
                $datos["descripcion"] ?? "",
                $datos["precio"],
                $datos["id"]
            ]);
            echo json_encode(["mensaje" => "Producto actualizado correctamente"]);
            break;

        case "DELETE":
            $datos = json_decode(file_get_contents("php://input"), true);
            $stmt = $conexion->prepare(
                "DELETE FROM productos WHERE id = ?"
            );
            $stmt->execute([$datos["id"]]);
            echo json_encode(["mensaje" => "Producto eliminado correctamente"]);
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error al procesar la solicitud"]);
}
