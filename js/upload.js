
$( document ).ready(function() {
	_.extend(window, Backbone.Events);
	window.onresize = function() { window.trigger('resize') };
	window.peptide = new AnnotatedSpectrumModel();
	window.peptideView = new PeptideView({model: window.peptide, el:"#peptideDiv"});
	window.pepInputView = new PepInputView({model: window.peptide, el:"#myPeptide"});
	//window.precursorInfoView = new PrecursorInfoView({model: window.peptide, el:"#precursorInfo"});
	$("#addCLModal").easyModal({
		onClose: function(myModal){
			$('#myCL').val('');
		}
	});
	$("#submitDataModal").easyModal();


	$('#myCL').change(function(){ 
		var value = $(this).val();
		if (value == "add")
			$("#addCLModal").trigger('openModal');
		else
			window.peptide.set("clModMass", value);
	});

	updateCL();		//gets customCL data from cookie and fills in options

	$('#addCustomCLform').submit(function(e){
		e.preventDefault();
		var clname = $('#newCLname').val();
		var clmass = $('#newCLmodmass').val();
		var cl = JSON.stringify({ "clName": clname, "clModMass": clmass });

		if (Cookies.get('customCL') === undefined){
			Cookies.set('customCL', {"data":[]})
		}
		var JSONobj = JSON.parse(Cookies.get('customCL'));
		JSONobj.data.push(cl);
		cookie = JSON.stringify(JSONobj);
		Cookies.set('customCL', cookie);
		$("#addCLModal").trigger('closeModal');
		updateCL(clmass);
	});

	$('#myPrecursorZ').on('change', function () {
		window.peptide.set("charge", this.value);
	});


	// $('#modificationTable').on( 'draw.dt', function () {
	// 	var json = modTable.ajax.json();
	// 	//window.peptide.set("modifications", json);
	// });

	$('#modificationTable').on('input', 'input', function() {

		var row = this.getAttribute("row")
		var modName = $('#modName_'+row).val();
		var modMass = parseFloat($('#modMass_'+row).val());
		var modSpec = $('#modSpec_'+row).val();

		var mod = {'id': modName, 'mass': modMass, 'aminoAcids': modSpec};

		window.peptide.updateUserModifications(mod);

	 });

	$('#resetModMasses').click(function(){
		Cookies.remove('customMods');
		window.peptide.getKnownModifications();
		if(window.peptide.pepStrsMods !== undefined)
			modTable.ajax.url( "forms/convertMods.php?peps="+encodeURIComponent(window.peptide.pepStrsMods.join(";"))).load();	
	});

	$('.ionSelectChkbox').change(function(){
		var ionSelectionArr = new Array();
		$('.ionSelectChkbox:checkbox:checked').each(function(){
			ionSelectionArr.push($(this).val());
		});
		if (ionSelectionArr.length == 0)
			$('#ionSelection').val("Select ions...");
		else
			$('#ionSelection').val(ionSelectionArr.join(", "));
	});

    window.modTable = $('#modificationTable').DataTable( {
    	"paging":   false,
        "ordering": false,
        "info":     false,
        "searching":false,
        "processing": true,
        "serverSide": true,
        "ajax": "forms/convertMods.php?peps=",
        "columns": [
            { "data": "id" },
        	{},
            {},
            { "data": "aminoAcid" },
            ],

        "columnDefs": [
        	{
				"render": function ( data, type, row, meta ) {
					return '<input class="form-control" id="modName_'+meta.row+'" name="mods[]" readonly type="text" value='+data+'>';
				},
				"class": "invisible",
				"targets": 0,
			},
			{
				"render": function ( data, type, row, meta ) {
					return row['id'];
				},
				"targets": 1,
			},
			{
				"render": function ( data, type, row, meta ) {
					data = 0;
					for (var i = 0; i < window.peptide.userModifications.length; i++) {
						if(window.peptide.userModifications[i].id == row.id){
							data = window.peptide.userModifications[i].mass;
							var found = true;
						}
					}
					if (!found){
						for (var i = 0; i < window.peptide.knownModifications['modifications'].length; i++) {
							if(window.peptide.knownModifications['modifications'][i].id == row.id)
								data = window.peptide.knownModifications['modifications'][i].mass;
						}
					}
					return '<input class="form-control" id="modMass_'+meta.row+'" row="'+meta.row+'" name="modMasses[]" type="number" min=0 step=0.0001 required value='+data+' autocomplete=off>';
				},
				"targets": 2,
			},
			{
				"render": function ( data, type, row, meta ) {
					for (var i = 0; i < window.peptide.userModifications.length; i++) {
						if(window.peptide.userModifications[i].id == row.id){
							data = window.peptide.userModifications[i].aminoAcids;
							var found = true;
						}
					}
					if (!found){				
						for (var i = 0; i < window.peptide.knownModifications['modifications'].length; i++) {
							if(window.peptide.knownModifications['modifications'][i].id == row.id){						
								data = data.split(",");
								data = _.union(data, window.peptide.knownModifications['modifications'][i].aminoAcids);
								data.sort();
								data = data.join("");
								
							}
						}
					}
					return '<input class="form-control" id="modSpec_'+meta.row+'" row="'+meta.row+'" name="modSpecificities[]" type="text" required value='+data+' autocomplete=off>'
				},
				"targets": 3,
			}
            ]
    });
    $('#fileupload').fileupload({
        dataType: 'json',
        fileTypes: "mzid|mzml",
		maxChunkSize: 100000000,	//100MB
		progressall: function (e, data) {
		    var progress = parseInt(data.loaded / data.total * 100, 10);
		    $('#uploadProgress .file_upload_bar').css(
		        'width',
		        progress + '%'
		    );
		    $('#uploadProgress .file_upload_percent').html(progress + '%');
		},
		add: function (e, data) {

			if(new RegExp("(.mzid)$", 'i').test(data.files[0].name)){
				$('#mzid_checkbox').prop( "checked", false ).change();
				$('#mzid_fileBox .fileName').html(data.files[0].name);
				data.context = $('#mzid_fileBox .statusBox').html('<div class="loader"></div>');
				data.submit();
			}

			if(new RegExp("(.mzml)$", 'i').test(data.files[0].name)){
				$('#mzml_checkbox').prop( "checked", false ).change();
				$('#mzml_fileBox .fileName').html(data.files[0].name);
				data.context = $('#mzml_fileBox .statusBox').html('<div class="loader"></div>');
				data.submit();						
			}

			var that = this;
			$.getJSON('vendor/jQueryFileUploadMin/fileUpload.php', {file: data.files[0].name}, function (result) {
			    var file = result.file;
			    data.uploadedBytes = file && file.size;
			    $.blueimp.fileupload.prototype
			        .options.add.call(that, e, data);
			});

		},
		maxRetries: 100,
		retryTimeout: 500,
		fail: function (e, data) {
		    // jQuery Widget Factory uses "namespace-widgetname" since version 1.10.0:
		    var fu = $(this).data('blueimp-fileupload') || $(this).data('fileupload'),
		        retries = data.context.data('retries') || 0,
		        retry = function () {
		            $.getJSON('vendor/jQueryFileUploadMin/fileUpload.php', {file: data.files[0].name})
		                .done(function (result) {
		                    var file = result.file;
		                    data.uploadedBytes = file && file.size;
		                    // clear the previous data:
		                    data.data = null;
		                    data.submit();
		                })
		                .fail(function () {
		                    fu._trigger('fail', e, data);
		                });
		        };
		    if (data.errorThrown !== 'abort' &&
		            data.uploadedBytes < data.files[0].size &&
		            retries < fu.options.maxRetries) {
		        retries += 1;
		        data.context.data('retries', retries);
		        window.setTimeout(retry, retries * fu.options.retryTimeout);
		        return;
		    }
		    data.context.removeData('retries');
		    $.blueimp.fileupload.prototype
		        .options.fail.call(this, e, data);
		},

		done: function (e, data) {
			if(data.context[0].dataset['filetype'] == 'mzml')
				$('#mzml_checkbox').prop( "checked", true ).change();
			if(data.context[0].dataset['filetype'] == 'mzid')
				$('#mzid_checkbox').prop( "checked", true ).change();
		    data.context.html('<span class="checkmark"><div class="checkmark_stem"></div><div class="checkmark_kick"></div></span>');
		}
    });

	$(".uploadCheckbox").change(function(){
	    if ($('.uploadCheckbox:checked').length == $('.uploadCheckbox').length) {
	       $('#startParsing').prop('disabled', false);
	    }
	    else{
	    	$('#startParsing').prop('disabled', true);
	    }
	});

	$("#startParsing").click(function(e){
		e.preventDefault();
		var spinner = new Spinner({scale: 5}).spin();
		var target = d3.select("#submitDataModal > .spinnerWrapper").node();
		var formData = new FormData();
		formData.append("mzml_fn", $('#mzml_fileBox .fileName').html());
		formData.append("mzid_fn", $('#mzid_fileBox .fileName').html());

		$.ajax({
	        url: "php/parseData.php",
			type: 'POST',
			data: formData,
			//async: false,
			contentType: false,
			processData: false,
			beforeSend: function(){
				$(".overlay").css("visibility", "visible").css("z-index", 1);
				target.appendChild(spinner.el);
				$("#submitDataModal").trigger('openModal');

			},
			success: function (data) {
				spinner.stop();
				resp = JSON.parse(data);
				if (resp.errors.length == 0)
					window.location.href = "viewSpectrum.php";
				else{
					alert("There were errors parsing your data. See the console for more information");
					resp.errors.forEach(function (error){
						console.log("error type: " + error.type + "\n message: "+ error.message);
					})
					
				}
			}
		  });	 
		  return false;					
	});    

});

function doExample(){
	$.get("example/peaklist.txt",function(data){
		$("#myPeaklist").val(data);
	});
	$("#myPeptide").val("QNCcmELFEQLGEYK#FQNALLVR;K#QTALVELVK");
	pepInputView.contentChanged();
	$("#myTolerance").val("20.0");
	$("#myPrecursorZ").val("4");
	$("#myPrecursorZ").change();	
	$("#myCL").val("138.06807961");
	//$("#myFragmentation").val("HCD");
	$("#myToleranceUnit").val("ppm");	
	$("#myCL").change();

	//ions
	$('.ionSelectChkbox').prop('checked', false);
	$('#PeptideIon').prop('checked', true);
	$('#BIon').prop('checked', true);
	$('#YIon').prop('checked', true).change();

};

function doClearForm(){
	$("#myPeptide").val("");
	$("#myPeaklist").val("");	
	$("#myTolerance").val("");
	$("#myPrecursorZ").val("");
	$("#myCL").val("");
	$('.ionSelectChkbox').prop('checked', false);
	window.peptide.clear();
	pepInputView.contentChanged();
};

function updateCL(selected){
	var cookie = Cookies.get('customCL');
	if (cookie !== undefined){
		$("option[class=customCL]").remove();
		var selectValues = JSON.parse(Cookies.get('customCL')).data;
		$.each(selectValues, function(key, value) {   
			var cl = JSON.parse(value);
			$('#myCL')
				.append($("<option></option>")
				.attr("value", cl.clModMass)
				.attr("class", "customCL")
				.text(cl.clName+" ["+cl.clModMass+" Da]")); 
		});
		//select new cl
		$('#myCL').val(selected);
	}
};