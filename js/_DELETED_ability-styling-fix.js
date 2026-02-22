// Additional fix to ensure abilities display properly on cards
(function() {
    console.log('🎨 Applying ability display styling fix...');
    
    // Add CSS to make abilities more visible
    const style = document.createElement('style');
    style.textContent = `
        .card-description {
            color: #ffd700 !important;
            font-weight: bold !important;
            font-size: 11px !important;
            text-align: center !important;
            padding: 2px !important;
            min-height: 16px !important;
        }
        
        .card-description:empty::after {
            content: "No ability";
            color: #888;
            font-weight: normal;
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Ability display styling applied');
})();