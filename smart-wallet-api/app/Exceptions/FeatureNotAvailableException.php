<?php

namespace App\Exceptions;

use Exception;

class FeatureNotAvailableException extends Exception
{
    protected $feature;
    protected $level;

    public function __construct(string $feature, string $level, string $message = '')
    {
        $this->feature = $feature;
        $this->level = $level;

        if (empty($message)) {
            $message = "The feature '{$feature}' is not available for your current level '{$level}'.";
        }

        parent::__construct($message);
    }

    public function getFeature(): string
    {
        return $this->feature;
    }

    public function getLevel(): string
    {
        return $this->level;
    }
}
