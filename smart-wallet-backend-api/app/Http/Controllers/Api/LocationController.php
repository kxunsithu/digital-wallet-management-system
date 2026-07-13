<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StateRegion;
use App\Models\Township;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function getStateRegions()
    {
        $regions = StateRegion::orderBy('name')->get();
        return response()->json([
            'success' => true,
            'data' => $regions
        ]);
    }

    public function storeStateRegion(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|unique:state_regions,name|max:255',
        ]);

        $region = StateRegion::create($data);

        return response()->json([
            'success' => true,
            'message' => 'State/Region created successfully.',
            'data' => $region
        ], 201);
    }

    public function updateStateRegion(Request $request, $id)
    {
        $region = StateRegion::find($id);
        if (!$region) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $data = $request->validate([
            'name' => 'required|string|unique:state_regions,name,' . $id . '|max:255',
        ]);

        $region->update($data);

        return response()->json([
            'success' => true,
            'message' => 'State/Region updated successfully.',
            'data' => $region
        ]);
    }

    public function deleteStateRegion($id)
    {
        $region = StateRegion::find($id);
        if (!$region) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $region->delete();
        return response()->json(['success' => true, 'message' => 'State/Region deleted.']);
    }

    public function getTownships(Request $request)
    {
        $query = Township::with('stateRegion')->orderBy('name');

        if ($request->filled('state_region_id')) {
            $query->where('state_region_id', $request->query('state_region_id'));
        }

        $townships = $query->get();

        return response()->json([
            'success' => true,
            'data' => $townships
        ]);
    }

    public function storeTownship(Request $request)
    {
        $data = $request->validate([
            'state_region_id' => 'required|exists:state_regions,id',
            'name' => 'required|string|max:255',
        ]);

        $township = Township::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Township created successfully.',
            'data' => $township->load('stateRegion')
        ], 201);
    }

    public function updateTownship(Request $request, $id)
    {
        $township = Township::find($id);
        if (!$township) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $data = $request->validate([
            'state_region_id' => 'required|exists:state_regions,id',
            'name' => 'required|string|max:255',
        ]);

        $township->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Township updated successfully.',
            'data' => $township->load('stateRegion')
        ]);
    }

    public function deleteTownship($id)
    {
        $township = Township::find($id);
        if (!$township) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $township->delete();
        return response()->json(['success' => true, 'message' => 'Township deleted.']);
    }
}
