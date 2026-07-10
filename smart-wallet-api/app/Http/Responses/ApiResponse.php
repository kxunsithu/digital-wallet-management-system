<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * Return a success JSON response.
     */
    public static function success(string $message = 'Success', mixed $data = null, int $statusCode = 200): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a created (201) JSON response.
     */
    public static function created(string $message = 'Created successfully', mixed $data = null): JsonResponse
    {
        return static::success($message, $data, 201);
    }

    /**
     * Return an error JSON response.
     */
    public static function error(string $message = 'Error', ?array $errors = null, int $statusCode = 400): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a validation error JSON response.
     */
    public static function validationError(string $message = 'Validation failed', array $errors = []): JsonResponse
    {
        return static::error($message, $errors, 422);
    }

    /**
     * Return an unauthorized JSON response.
     */
    public static function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return static::error($message, null, 401);
    }

    /**
     * Return a forbidden JSON response.
     */
    public static function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return static::error($message, null, 403);
    }

    /**
     * Return a not found JSON response.
     */
    public static function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return static::error($message, null, 404);
    }

    /**
     * Return a too many requests JSON response.
     */
    public static function tooManyRequests(string $message = 'Too many requests. Please try again later.'): JsonResponse
    {
        return static::error($message, null, 429);
    }
}
