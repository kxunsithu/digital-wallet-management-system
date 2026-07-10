<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class InfinireachSmsService
{
    protected string $apiKey;
    protected string $senderNumber;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.infinireach.api_key', '');
        $this->senderNumber = config('services.infinireach.sender_number', '+959944074981');
        $this->baseUrl = config('services.infinireach.base_url', 'https://api.infinireach.io/api/v1');
    }

    /**
     * Send an SMS message.
     *
     * @return array{success: bool, response: mixed}
     */
    public function send(string $phoneNumber, string $message): array
    {
        $phoneNumber = $this->formatPhoneNumber($phoneNumber);

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-API-Key' => $this->apiKey,
            ])->post("{$this->baseUrl}/messages", [
                'channel' => 'sms',
                'to' => $phoneNumber,
                'from' => $this->senderNumber,
                'message' => $message,
            ]);

            if ($response->successful()) {
                Log::info('SMS sent successfully', [
                    'phone' => $phoneNumber,
                    'status' => $response->status(),
                ]);

                return [
                    'success' => true,
                    'response' => $response->json(),
                ];
            }

            Log::error('SMS sending failed', [
                'phone' => $phoneNumber,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'response' => $response->json(),
            ];
        } catch (\Exception $e) {
            Log::error('SMS sending exception', [
                'phone' => $phoneNumber,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'response' => ['error' => $e->getMessage()],
            ];
        }
    }

    /**
     * Convert local phone number format (09xxxxxxxxx) to international (+959xxxxxxxxx).
     */
    public function formatPhoneNumber(string $phoneNumber): string
    {
        // Remove all spaces and dashes
        $phoneNumber = preg_replace('/[\s\-]/', '', $phoneNumber);

        // If it starts with 09, replace with +959
        if (str_starts_with($phoneNumber, '09')) {
            return '+959' . substr($phoneNumber, 2);
        }

        // If it starts with 959, add +
        if (str_starts_with($phoneNumber, '959')) {
            return '+' . $phoneNumber;
        }

        // If it already starts with +959, return as is
        if (str_starts_with($phoneNumber, '+959')) {
            return $phoneNumber;
        }

        // Return as is if unrecognized format
        return $phoneNumber;
    }
}
