import copy

def calculate_iou(box1, box2):
    x1, y1, w1, h1 = box1
    x2, y2, w2, h2 = box2
    
    x_left = max(x1, x2)
    y_top = max(y1, y2)
    x_right = min(x1 + w1, x2 + w2)
    y_bottom = min(y1 + h1, y2 + h2)
    
    if x_right < x_left or y_bottom < y_top:
        return 0.0
    
    intersection_area = (x_right - x_left) * (y_bottom - y_top)
    area1 = w1 * h1
    
    return intersection_area / float(area1)

def get_free_cards(tiles):
    free_cards = []
    
    for c_id, c_data in tiles.items():
        is_covered = False
        for o_id, o_data in tiles.items():
            if c_id == o_id: continue
            
            if o_data['layer'] < c_data['layer']:
                iou = calculate_iou(
                    (c_data['x'], c_data['y'], c_data['w'], c_data['h']),
                    (o_data['x'], o_data['y'], o_data['w'], o_data['h'])
                )
                if iou > 0.15:
                    is_covered = True
                    break
        
        if not is_covered:
            free_cards.append(c_id)
            
    return free_cards

def solve_board(tiles_list):
    tiles = { i: t for i, t in enumerate(tiles_list) }
    memo = {}
    
    def dfs(current_tiles, tray):
        state_key = (frozenset(current_tiles.keys()), tuple(sorted(tray)))
        if state_key in memo:
            return memo[state_key]
            
        if len(current_tiles) == 0:
            return [] # Won!
            
        if len(tray) >= 7:
            return None # Lost
            
        free_cards = get_free_cards(current_tiles)
        
        # Priority heuristic: pick cards that match something in tray first
        tray_counts = {}
        for t in tray: tray_counts[t] = tray_counts.get(t, 0) + 1
        
        # Sort free_cards: those matching 2 in tray first, then 1, then 0.
        def score(cid):
            lbl = current_tiles[cid]['label']
            if lbl == 'Unknown': return -1
            return tray_counts.get(lbl, 0)
            
        free_cards.sort(key=score, reverse=True)
        
        for card_id in free_cards:
            card = current_tiles[card_id]
            
            if len(tray) >= 6 and tray_counts.get(card['label'], 0) == 0 and card['label'] != 'Unknown':
                continue # Pruning: if tray is at 6 and this card doesn't clear anything, we lose anyway.
                
            new_tiles = dict(current_tiles)
            del new_tiles[card_id]
            
            new_tray = list(tray)
            new_tray.append(card['label'])
            
            count = new_tray.count(card['label'])
            if count == 3 and card['label'] != 'Unknown':
                new_tray = [t for t in new_tray if t != card['label']]
                
            if len(new_tray) <= 7:
                result = dfs(new_tiles, new_tray)
                if result is not None:
                    memo[state_key] = [card] + result
                    return memo[state_key]
                    
        memo[state_key] = None
        return None

    solution = dfs(tiles, [])
    return solution
