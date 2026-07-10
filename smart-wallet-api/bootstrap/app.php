<?php

use App\Exceptions\FeatureNotAvailableException;
use App\Exceptions\InsufficientBalanceException;
use App\Exceptions\TransactionLimitExceededException;
use App\Http\Responses\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);

        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Always render JSON for API routes
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Validation errors
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::validationError(
                    $e->getMessage(),
                    $e->errors()
                );
            }
        });

        // Authentication errors
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::unauthorized('Unauthenticated. Please log in.');
            }
        });

        // Access denied
        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::forbidden($e->getMessage() ?: 'You do not have permission to perform this action.');
            }
        });

        // Not found
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::notFound($e->getMessage() ?: 'The requested resource was not found.');
            }
        });

        // Method not allowed
        $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::error('Method not allowed.', null, 405);
            }
        });

        // Rate limiting / throttle
        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::tooManyRequests('Too many requests. Please try again later.');
            }
        });

        // Transaction limit exceeded
        $exceptions->render(function (TransactionLimitExceededException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::error($e->getMessage(), [
                    'limit_type' => $e->getLimitType(),
                    'limit' => $e->getLimit(),
                    'used' => $e->getUsed(),
                    'remaining' => $e->getRemaining(),
                ], 422);
            }
        });

        // Feature not available
        $exceptions->render(function (FeatureNotAvailableException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::forbidden($e->getMessage());
            }
        });

        // Insufficient balance
        $exceptions->render(function (InsufficientBalanceException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return ApiResponse::error($e->getMessage(), null, 422);
            }
        });
    })->create();
