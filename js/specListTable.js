$(function() {

	if(window.dbView){
		//SpecListTable
		window.specListTable = $('#specListTable').DataTable( {
			// "paging":   false,
		 //    "ordering": false,
		 //    "info":     false,
		 	"dom": '<"specListToolbar">frtip',
		    "searching": true,
		    // "processing": true,
		    // "serverSide": true,
		    "ajax": "php/getSpecList.php",
		    "columns": [
		        { "data": "id" },
		        { "data": "mzid" },
				{ "data": "pep1" },
				{ "data": "pep2" },
				{ "data": "linkpos1" },	
				{ "data": "linkpos2" },	
				{ "data": "passThreshold" },			
		        ],
			// "aoSearchCols": [
			// 	null,
			// 	null,
			// 	null,
			// 	null,
			// 	null,
			// 	null,
			// 	{ "sSearch": "1" },
			// ],
			"createdRow": function( row, data, dataIndex ) {
				if ( data[6] == "0" )         
					$(row).addClass('red');
				if ( data[0] == "1")
					$(row).addClass("selected");
			 },
		    "columnDefs": [
		    	{
					"class": "invisible",
					"targets": [ 6],
				},	
				{ 
					"className": "dt-center",
					"render": function ( data, type, row, meta ) {
						if (data == 0)
							return '';
						else
							return data;
					},
					"searchable": false, 
					"targets": [4, 5]
				}		
	        ],
			// "initComplete": function(settings, json) {
			// 	window.Spectrum.resize();
			// },
			"drawCallback": function( settings ) {
				window.Spectrum.resize();
			}
		});

		$("div.specListToolbar").html('Filter: <label class="btn"><input id="passThreshold" type="checkbox">passing threshold</label><label class="btn"><input id="hideLinear" type="checkbox">hide linear</label>');

		$('div.dataTables_filter input').addClass('form-control').css('margin-bottom', '5px');

		$('#passThreshold').on( 'click', function () {
			if (this.checked){
			    window.specListTable
			        .columns( 6 )
			        .search( "1" )
			        .draw();				
			}
			else{
			    window.specListTable
			        .columns( 6 )
			        .search( "" )
			        .draw();
			}
		} );

		$('#hideLinear').on( 'click', function () {
			if (this.checked){
			    window.specListTable
			        .columns( 3 )
			        .search( ".+", true, false )
			        .draw();				
			}
			else{
			    window.specListTable
			        .columns( 3 )
			        .search( "" )
			        .draw();
			}
		} );
		window.specListTable.on('click', 'tbody tr', function() {

	        // if ( $(this).hasClass('selected') ) {
	        //     $(this).removeClass('selected');
	        // }
	        // else {
				window.specListTable.$('tr.selected').removeClass('selected');
				$(this).addClass('selected');
	        //}

			console.log('id : ', window.specListTable.row(this).data()[0]);
			loadSpectrum(window.specListTable.row(this).data()[0]);
		});

		function loadSpectrum(id){
			$.ajax({
				url: 'php/getSpectrum.php?i='+id,
				type: 'GET',
				async: false,
				cache: false,
				contentType: false,
				processData: false,
				success: function (returndata) {
					var json = JSON.parse(returndata);
					window.SpectrumModel.requestId = id;
					console.log(window.SpectrumModel.requestId);
					window.SpectrumModel.request_annotation(json);
				}
			});	 			
		};

		$('#prevSpectrum').click(function(){

			specListTable.rows( '.selected' ).nodes().to$().removeClass('selected');
			var curDataArr = window.specListTable.rows( { filter : 'applied'} ).data().toArray();
			var curIndex = curDataArr.findIndex(function(el){
				return el[0] == window.SpectrumModel.requestId
			});

			if (curIndex == -1)
				loadSpectrum(window.specListTable.rows( { filter : 'applied'} ).data()[0][0]);

			else if (curIndex - 1 >= 0){
				loadSpectrum(window.specListTable.rows( { filter : 'applied'} ).data()[curIndex-1][0]);
			}

			var newIndex = window.specListTable
				.column( 0 )
				.data()
				.indexOf( window.SpectrumModel.requestId );

			window.specListTable.row(newIndex).nodes().to$().addClass("selected");


		});

		$('#nextSpectrum').click(function(){

			// curIndex = window.specListTable
			// 	.rows( { filter : 'applied'} )
			// 	.column( 0 )
			// 	.data()
			// 	.indexOf( window.SpectrumModel.requestId );

			specListTable.rows( '.selected' ).nodes().to$().removeClass('selected');
			var curDataArr = window.specListTable.rows( { filter : 'applied'} ).data().toArray();
			var curIndex = curDataArr.findIndex(function(el){
				return el[0] == window.SpectrumModel.requestId
			});

			if (curIndex == -1)
				loadSpectrum(window.specListTable.rows( { filter : 'applied'} ).data()[0][0]);

			else if (curIndex + 1 < window.specListTable.rows( { filter : 'applied'} ).data().length){
				loadSpectrum(window.specListTable.rows( { filter : 'applied'} ).data()[curIndex+1][0]);
			}

			var newIndex = window.specListTable
				.column( 0 )
				.data()
				.indexOf( window.SpectrumModel.requestId );

			window.specListTable.row(newIndex).nodes().to$().addClass("selected");

		});
	}
});